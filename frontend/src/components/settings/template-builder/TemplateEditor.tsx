'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TemplateBlock, TemplateConfig, BlockType, getBlockCatalogueItem, BLOCK_CATALOGUE } from './types';
import { BlockPreview } from './BlockPreview';
import { BlockPalette } from './BlockPalette';
import { BlockSettingsPanel } from './BlockSettingsPanel';
import { GripVertical, Save, Eye, RotateCcw, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/useProjectStore';

// ─── Sortable Block Item (inside canvas) ──────────────────────────────

interface SortableBlockProps {
    block: TemplateBlock;
    selected: boolean;
    onClick: () => void;
    onDoubleClick: () => void;
}

function SortableBlock({ block, selected, onClick }: SortableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
        data: { type: block.type, fromCanvas: true },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        position: 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} onClick={onClick}>
            <div
                className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors z-10"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="w-3.5 h-3.5" />
            </div>
            <div style={{ marginLeft: 20 }}>
                <BlockPreview block={block} selected={selected} />
            </div>
        </div>
    );
}

// ─── Droppable Canvas ─────────────────────────────────────────────────

function A4Canvas({
    blocks,
    selectedId,
    onSelectBlock,
}: {
    blocks: TemplateBlock[];
    selectedId: string | null;
    onSelectBlock: (id: string | null) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: 'a4-canvas' });

    return (
        <div
            ref={setNodeRef}
            className="relative bg-white shadow-2xl mx-auto"
            style={{
                width: 794,   // A4 at 96dpi: 210mm ≈ 794px
                minHeight: 1123, // 297mm ≈ 1123px
                padding: '53px 60px', // ~14mm margin
                border: isOver ? '2px dashed #3b82f6' : '1px solid #e2e8f0',
                transition: 'border 0.15s',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onSelectBlock(null);
            }}
        >
            {/* A4 guide lines */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-blue-100" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-blue-100" />
            </div>

            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                    {blocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-300 gap-3">
                            <div className="text-4xl">📄</div>
                            <p className="text-sm font-medium">Şablona blok eklemek için sol panelden sürükleyin</p>
                        </div>
                    ) : (
                        blocks.map(block => (
                            <SortableBlock
                                key={block.id}
                                block={block}
                                selected={selectedId === block.id}
                                onClick={() => onSelectBlock(block.id)}
                                onDoubleClick={() => onSelectBlock(block.id)}
                            />
                        ))
                    )}
                </div>
            </SortableContext>

            {/* Empty drop zone hint when there are blocks */}
            {blocks.length > 0 && (
                <div
                    className={`mt-2 h-8 rounded border-2 border-dashed transition-all flex items-center justify-center text-xs text-slate-300 ${isOver ? 'border-blue-300 bg-blue-50 text-blue-400' : 'border-transparent'}`}
                >
                    {isOver && 'Buraya bırakın'}
                </div>
            )}
        </div>
    );
}

// ─── Main TemplateEditor ──────────────────────────────────────────────

interface TemplateEditorProps {
    initialConfig: TemplateConfig;
    templateType: 'offer' | 'invoice';
    projectId?: number | null;
}

let blockIdCounter = 1000;
const genId = () => `block_${++blockIdCounter}_${Date.now()}`;

export function TemplateEditor({ initialConfig, templateType, projectId }: TemplateEditorProps) {
    const [blocks, setBlocks] = useState<TemplateBlock[]>(initialConfig.blocks);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const { activeProject } = useProjectStore();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
    );

    const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;

    // ── Add block (from palette double-click or drop) ──
    const addBlock = useCallback((type: BlockType, insertAfterIndex?: number) => {
        const meta = BLOCK_CATALOGUE.find(b => b.type === type);
        if (!meta) return;
        const newBlock: TemplateBlock = {
            id: genId(),
            type,
            settings: { ...meta.defaultSettings },
        };
        setBlocks(prev => {
            if (insertAfterIndex !== undefined) {
                const next = [...prev];
                next.splice(insertAfterIndex + 1, 0, newBlock);
                return next;
            }
            return [...prev, newBlock];
        });
        setSelectedId(newBlock.id);
    }, []);

    // ── Remove block ──
    const removeBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        setSelectedId(prev => prev === id ? null : prev);
    }, []);

    // ── Update block settings ──
    const updateBlockSettings = useCallback((id: string, settings: Record<string, unknown>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, settings } : b));
    }, []);

    // ── DnD handlers ──
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const isFromPalette = active.data.current?.fromPalette;

        if (isFromPalette) {
            // Dropped from palette onto canvas
            const type = active.data.current?.type as BlockType;
            if (!type) return;
            const overIndex = blocks.findIndex(b => b.id === over.id);
            addBlock(type, overIndex >= 0 ? overIndex : undefined);
        } else {
            // Reorder within canvas
            if (active.id !== over.id) {
                setBlocks(prev => {
                    const oldIndex = prev.findIndex(b => b.id === active.id);
                    const newIndex = prev.findIndex(b => b.id === over.id);
                    return arrayMove(prev, oldIndex, newIndex);
                });
            }
        }
    };

    const handleDragOver = (_event: DragOverEvent) => {
        // Handled in dragEnd for simplicity
    };

    // ── Save ──
    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/template-configs', {
                project_id: projectId ?? activeProject?.id ?? null,
                type: templateType,
                name: templateType === 'offer' ? 'Teklif Şablonu' : 'Fatura Şablonu',
                blocks,
                page_settings: initialConfig.page_settings,
            });
            setSaved(true);
            toast.success('Şablon kaydedildi!');
            setTimeout(() => setSaved(false), 2500);
        } catch {
            toast.error('Şablon kaydedilemedi.');
        } finally {
            setSaving(false);
        }
    };

    // ── Reset to defaults ──
    const handleReset = () => {
        if (!confirm('Şablonu varsayılan düzene sıfırlamak istediğinize emin misiniz?')) return;
        setBlocks(initialConfig.blocks);
        setSelectedId(null);
    };

    // Active dragging block info
    const activeDragMeta = activeId
        ? (activeId.startsWith('palette-')
            ? BLOCK_CATALOGUE.find(b => `palette-${b.type}` === activeId)
            : BLOCK_CATALOGUE.find(b => b.type === blocks.find(bl => bl.id === activeId)?.type))
        : null;

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b bg-white shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <span className="text-primary text-lg">📄</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">
                            {templateType === 'offer' ? 'Teklif Şablonu' : 'Fatura Şablonu'}
                        </h2>
                        <p className="text-xs text-slate-400">{blocks.length} blok · A4 210×297mm</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Sıfırla
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-1.5 px-4 py-1.5 text-sm text-white rounded-lg transition-all font-medium shadow-sm ${saved ? 'bg-emerald-500' : 'bg-primary hover:bg-primary/90'}`}
                    >
                        {saving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : saved ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        {saved ? 'Kaydedildi!' : 'Kaydet'}
                    </button>
                </div>
            </div>

            {/* Three pane layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Block Palette */}
                <div className="w-52 shrink-0 border-r bg-slate-50 overflow-hidden flex flex-col">
                    <BlockPalette onAddBlock={addBlock} />
                </div>

                {/* Center: A4 Canvas */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                >
                    <div
                        className="flex-1 overflow-auto bg-slate-100 p-8"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setSelectedId(null);
                        }}
                    >
                        <A4Canvas
                            blocks={blocks}
                            selectedId={selectedId}
                            onSelectBlock={setSelectedId}
                        />
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeDragMeta && (
                            <div className="bg-white border-2 border-primary/40 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                <span>{activeDragMeta.icon}</span>
                                {activeDragMeta.label}
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>

                {/* Right: Block Settings */}
                <div className="w-56 shrink-0 border-l bg-white overflow-hidden flex flex-col">
                    <BlockSettingsPanel
                        block={selectedBlock}
                        onUpdate={updateBlockSettings}
                        onRemove={removeBlock}
                    />
                </div>
            </div>
        </div>
    );
}
