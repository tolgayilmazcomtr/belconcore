'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    DndContext, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay,
    PointerSensor, useSensor, useSensors, closestCenter, useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    TemplateBlock, TemplateConfig, BlockType, PageSettings, DEFAULT_PAGE_SETTINGS,
    getBlockCatalogueItem, BLOCK_CATALOGUE, getPagePx, MM_TO_PX,
    PAGE_DIMENSIONS_MM,
} from './types';
import { BlockPreview } from './BlockPreview';
import { BlockPalette } from './BlockPalette';
import { BlockSettingsPanel } from './BlockSettingsPanel';
import { Save, Loader2, CheckCircle2, RotateCcw, GripVertical, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/useProjectStore';

// ─── Sortable Block (inside canvas) ──────────────────────────────────

function SortableBlock({ block, selected, onClick }: {
    block: TemplateBlock; selected: boolean; onClick: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
        data: { type: block.type, fromCanvas: true },
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.25 : 1, position: 'relative' }}
            onClick={e => { e.stopPropagation(); onClick(); }}
        >
            {/* Drag handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: '#cbd5e1' }}
                {...attributes}
                {...listeners}
            >
                <GripVertical size={10} />
            </div>
            <div className="group" style={{ marginLeft: 14 }}>
                <BlockPreview block={block} selected={selected} />
            </div>
        </div>
    );
}

// ─── Droppable A4 Canvas ──────────────────────────────────────────────

function A4Canvas({ blocks, selectedId, onSelectBlock, pageSettings, zoom }: {
    blocks: TemplateBlock[];
    selectedId: string | null;
    onSelectBlock: (id: string | null) => void;
    pageSettings: PageSettings;
    zoom: number;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: 'a4-canvas' });
    const { width: wPx, height: hPx } = getPagePx(pageSettings.page_size, pageSettings.orientation);
    const marginPx = {
        top: pageSettings.margin_top * MM_TO_PX,
        bottom: pageSettings.margin_bottom * MM_TO_PX,
        left: pageSettings.margin_left * MM_TO_PX,
        right: pageSettings.margin_right * MM_TO_PX,
    };

    return (
        /* Outer wrapper sets the scaled size so the scrollable container knows the right size */
        <div style={{ width: wPx * zoom, height: hPx * zoom, flexShrink: 0 }}>
            <div
                style={{
                    width: wPx,
                    height: hPx,
                    transformOrigin: 'top left',
                    transform: `scale(${zoom})`,
                    background: '#fff',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
                    position: 'relative',
                    border: isOver ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    transition: 'border 0.15s',
                    boxSizing: 'border-box',
                }}
                ref={setNodeRef}
                onClick={e => { if (e.target === e.currentTarget) onSelectBlock(null); }}
            >
                {/* Margin guides (dashed) */}
                <div style={{
                    position: 'absolute',
                    top: marginPx.top, bottom: marginPx.bottom,
                    left: marginPx.left, right: marginPx.right,
                    border: '0.5px dashed #bfdbfe',
                    pointerEvents: 'none',
                    borderRadius: 1,
                }} />

                {/* Content area */}
                <div
                    style={{
                        position: 'absolute',
                        top: marginPx.top, bottom: marginPx.bottom,
                        left: marginPx.left, right: marginPx.right,
                        overflow: 'hidden',
                    }}
                    onClick={e => { if (e.target === e.currentTarget) onSelectBlock(null); }}
                >
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-0.5">
                            {blocks.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: '#94a3b8', gap: 8 }}>
                                    <div style={{ width: 32, height: 42, border: '1.5px dashed #cbd5e1', borderRadius: 2 }} />
                                    <p style={{ fontSize: 9, textAlign: 'center' }}>Bileşenleri buraya sürükleyin</p>
                                </div>
                            ) : (
                                blocks.map(block => (
                                    <SortableBlock
                                        key={block.id}
                                        block={block}
                                        selected={selectedId === block.id}
                                        onClick={() => onSelectBlock(block.id)}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </div>

                {/* Page size label */}
                <div style={{
                    position: 'absolute', bottom: 6, right: 8,
                    fontSize: 7, color: '#d1d5db', fontFamily: 'monospace', letterSpacing: '0.04em',
                }}>
                    {pageSettings.page_size} &bull; {pageSettings.orientation === 'portrait' ? 'Dikey' : 'Yatay'}
                </div>
            </div>
        </div>
    );
}

// ─── Page Settings Panel ──────────────────────────────────────────────

const PAGE_SIZES = Object.keys(PAGE_DIMENSIONS_MM) as Array<keyof typeof PAGE_DIMENSIONS_MM>;

function PageSettingsPanel({ settings, onChange }: {
    settings: PageSettings;
    onChange: (s: PageSettings) => void;
}) {
    const set = <K extends keyof PageSettings>(key: K, val: PageSettings[K]) =>
        onChange({ ...settings, [key]: val });

    const labelCls = 'block text-[10px] font-medium text-slate-500 mb-0.5';
    const inputCls = 'w-full text-xs rounded border border-slate-200 bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400';
    const numCls = `${inputCls} text-center`;

    return (
        <div className="space-y-4 p-3">
            {/* Page size */}
            <div>
                <label className={labelCls}>Sayfa Boyutu</label>
                <select className={inputCls} value={settings.page_size} onChange={e => set('page_size', e.target.value as PageSettings['page_size'])}>
                    {PAGE_SIZES.map(s => {
                        const d = PAGE_DIMENSIONS_MM[s];
                        return <option key={s} value={s}>{s} ({d.width}×{d.height}mm)</option>;
                    })}
                </select>
            </div>

            {/* Orientation */}
            <div>
                <label className={labelCls}>Yön</label>
                <div className="flex gap-1">
                    {(['portrait', 'landscape'] as const).map(o => (
                        <button
                            key={o}
                            onClick={() => set('orientation', o)}
                            className={`flex-1 text-[10px] py-1 rounded border font-medium transition-all ${settings.orientation === o ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                        >
                            {o === 'portrait' ? 'Dikey' : 'Yatay'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Margins */}
            <div>
                <label className={labelCls}>Kenar Boşlukları (mm)</label>
                <div className="grid grid-cols-2 gap-1.5">
                    {([['margin_top', 'Üst'], ['margin_bottom', 'Alt'], ['margin_left', 'Sol'], ['margin_right', 'Sağ']] as const).map(([key, lbl]) => (
                        <div key={key}>
                            <label className="block text-[9px] text-slate-400 mb-0.5 text-center">{lbl}</label>
                            <input
                                type="number" min={0} max={50} step={1}
                                className={numCls}
                                value={settings[key] as number}
                                onChange={e => set(key, Number(e.target.value))}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Font size */}
            <div>
                <label className={labelCls}>Temel Font Büyüklüğü (pt)</label>
                <input type="number" min={6} max={14} step={0.5} className={inputCls}
                    value={settings.font_size}
                    onChange={e => set('font_size', Number(e.target.value))}
                />
            </div>
        </div>
    );
}

// ─── Main Editor ──────────────────────────────────────────────────────

interface TemplateEditorProps {
    initialConfig: TemplateConfig;
    templateType: 'offer' | 'invoice';
    projectId?: number | null;
}

let _counter = 1000;
const genId = () => `b${++_counter}_${Date.now()}`;

type RightPanel = 'block' | 'page';

export function TemplateEditor({ initialConfig, templateType, projectId }: TemplateEditorProps) {
    const [blocks, setBlocks] = useState<TemplateBlock[]>(initialConfig.blocks);
    const [pageSettings, setPageSettings] = useState<PageSettings>({
        ...DEFAULT_PAGE_SETTINGS,
        ...initialConfig.page_settings,
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [rightPanel, setRightPanel] = useState<RightPanel>('page');
    const [zoom, setZoom] = useState(0.72);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const { activeProject } = useProjectStore();

    // Switch to block panel when block is selected
    useEffect(() => {
        if (selectedId) setRightPanel('block');
    }, [selectedId]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;

    const addBlock = useCallback((type: BlockType, insertAfterIndex?: number) => {
        const meta = BLOCK_CATALOGUE.find(b => b.type === type);
        if (!meta) return;
        const nb: TemplateBlock = { id: genId(), type, settings: { ...meta.defaultSettings } };
        setBlocks(prev => {
            if (insertAfterIndex !== undefined && insertAfterIndex >= 0) {
                const next = [...prev];
                next.splice(insertAfterIndex + 1, 0, nb);
                return next;
            }
            return [...prev, nb];
        });
        setSelectedId(nb.id);
    }, []);

    const removeBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        setSelectedId(prev => prev === id ? null : prev);
    }, []);

    const updateBlockSettings = useCallback((id: string, settings: Record<string, unknown>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, settings } : b));
    }, []);

    const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveId(null);
        if (!over) return;
        if (active.data.current?.fromPalette) {
            const type = active.data.current?.type as BlockType;
            const overIndex = blocks.findIndex(b => b.id === over.id);
            addBlock(type, overIndex);
        } else if (active.id !== over.id) {
            setBlocks(prev => {
                const oi = prev.findIndex(b => b.id === active.id);
                const ni = prev.findIndex(b => b.id === over.id);
                return arrayMove(prev, oi, ni);
            });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/template-configs', {
                project_id: projectId ?? activeProject?.id ?? null,
                type: templateType,
                name: templateType === 'offer' ? 'Teklif Şablonu' : 'Fatura Şablonu',
                blocks,
                page_settings: pageSettings,
            });
            setSaved(true);
            toast.success('Şablon kaydedildi.');
            setTimeout(() => setSaved(false), 2500);
        } catch {
            toast.error('Kayıt sırasında bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (!confirm('Şablonu varsayılan düzene sıfırlamak istediğinize emin misiniz?')) return;
        setBlocks(initialConfig.blocks);
        setPageSettings({ ...DEFAULT_PAGE_SETTINGS, ...initialConfig.page_settings });
        setSelectedId(null);
    };

    const activeDragMeta = activeId
        ? (activeId.startsWith('palette-')
            ? BLOCK_CATALOGUE.find(b => `palette-${b.type}` === activeId)
            : BLOCK_CATALOGUE.find(b => b.type === blocks.find(bl => bl.id === activeId)?.type))
        : null;

    const templateLabel = templateType === 'offer' ? 'Teklif Şablonu' : 'Fatura Şablonu';
    const { width: wMm, height: hMm } = PAGE_DIMENSIONS_MM[pageSettings.page_size];
    const dimLabel = pageSettings.orientation === 'portrait'
        ? `${wMm}×${hMm}mm`
        : `${hMm}×${wMm}mm`;

    return (
        <div className="flex flex-col h-full bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* ── Toolbar ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between h-10 px-3 border-b border-slate-200 bg-slate-50 shrink-0">
                {/* Left: Template info */}
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-slate-700 truncate">{templateLabel}</span>
                    <span className="text-slate-300 text-xs">|</span>
                    <span className="text-[11px] text-slate-400 font-mono">{pageSettings.page_size} · {dimLabel}</span>
                    <span className="text-slate-300 text-xs">|</span>
                    <span className="text-[11px] text-slate-400">{blocks.length} blok</span>
                </div>

                {/* Center: Zoom controls */}
                <div className="flex items-center gap-1 border border-slate-200 rounded bg-white px-1 py-0.5">
                    <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(1)))}
                        className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors">
                        <ZoomOut size={12} />
                    </button>
                    <span className="text-[10px] font-medium text-slate-600 w-9 text-center select-none">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1)))}
                        className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors">
                        <ZoomIn size={12} />
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 text-slate-500 border border-slate-200 rounded hover:bg-slate-100 transition-colors font-medium"
                    >
                        <RotateCcw size={11} />
                        Sıfırla
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-1.5 text-[11px] px-3 py-1 text-white rounded font-semibold transition-all ${saved ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {saving ? <Loader2 size={11} className="animate-spin" /> : saved ? <CheckCircle2 size={11} /> : <Save size={11} />}
                        {saved ? 'Kaydedildi' : 'Kaydet'}
                    </button>
                </div>
            </div>

            {/* ── 3-pane layout ───────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: Block Palette */}
                <div className="w-48 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
                    <BlockPalette onAddBlock={addBlock} />
                </div>

                {/* Center: Canvas */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={(_e: DragOverEvent) => { }}
                >
                    <div
                        className="flex-1 overflow-auto bg-[#e8eaed] flex justify-center items-start pt-8 pb-12 px-8"
                        onClick={e => { if (e.target === e.currentTarget) setSelectedId(null); }}
                    >
                        <A4Canvas
                            blocks={blocks}
                            selectedId={selectedId}
                            onSelectBlock={setSelectedId}
                            pageSettings={pageSettings}
                            zoom={zoom}
                        />
                    </div>

                    <DragOverlay>
                        {activeDragMeta && (
                            <div className="bg-white border border-blue-300 shadow-lg rounded px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700">
                                {activeDragMeta.label}
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>

                {/* Right: Settings Panel */}
                <div className="w-56 shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
                    {/* Panel tabs */}
                    <div className="flex border-b border-slate-200 shrink-0">
                        <button
                            onClick={() => setRightPanel('block')}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-semibold py-2 border-b-2 transition-colors ${rightPanel === 'block' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                        >
                            Blok Ayarları
                        </button>
                        <button
                            onClick={() => setRightPanel('page')}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-semibold py-2 border-b-2 transition-colors ${rightPanel === 'page' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Settings size={10} />
                            Sayfa
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {rightPanel === 'block' ? (
                            <BlockSettingsPanel
                                block={selectedBlock}
                                onUpdate={updateBlockSettings}
                                onRemove={removeBlock}
                            />
                        ) : (
                            <PageSettingsPanel
                                settings={pageSettings}
                                onChange={setPageSettings}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
