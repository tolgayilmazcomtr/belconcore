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
import {
    Save, Loader2, CheckCircle2, RotateCcw, GripVertical,
    ZoomIn, ZoomOut, Settings, Upload, X, ImageIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/useProjectStore';

// ─── Sortable block inside canvas ─────────────────────────────────────

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
            {/* Drag handle — always visible on canvas items */}
            <div
                className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
                style={{ width: 14, color: '#d1d5db' }}
                {...attributes}
                {...listeners}
            >
                <GripVertical size={10} />
            </div>
            <div style={{ marginLeft: 14 }}>
                <BlockPreview block={block} selected={selected} />
            </div>
        </div>
    );
}

// ─── Droppable A4 canvas ──────────────────────────────────────────────

function A4Canvas({ blocks, selectedId, onSelectBlock, pageSettings, zoom }: {
    blocks: TemplateBlock[];
    selectedId: string | null;
    onSelectBlock: (id: string | null) => void;
    pageSettings: PageSettings;
    zoom: number;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: 'a4-canvas' });
    const { width: wPx, height: hPx } = getPagePx(pageSettings.page_size, pageSettings.orientation);
    const mt = pageSettings.margin_top * MM_TO_PX;
    const mb = pageSettings.margin_bottom * MM_TO_PX;
    const ml = pageSettings.margin_left * MM_TO_PX;
    const mr = pageSettings.margin_right * MM_TO_PX;

    return (
        <div style={{ width: wPx * zoom, height: hPx * zoom, flexShrink: 0 }}>
            <div
                ref={setNodeRef}
                style={{
                    width: wPx, height: hPx,
                    transformOrigin: 'top left',
                    transform: `scale(${zoom})`,
                    background: '#fff',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
                    position: 'relative',
                    border: isOver ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    transition: 'border 0.1s',
                    boxSizing: 'border-box',
                }}
                onClick={e => { if (e.target === e.currentTarget) onSelectBlock(null); }}
            >
                {/* Margin guide */}
                <div style={{
                    position: 'absolute',
                    top: mt, bottom: mb, left: ml, right: mr,
                    border: '0.5px dashed #bfdbfe',
                    pointerEvents: 'none',
                }} />

                {/* Content */}
                <div style={{ position: 'absolute', top: mt, bottom: mb, left: ml, right: mr, overflow: 'hidden' }}
                    onClick={e => { if (e.target === e.currentTarget) onSelectBlock(null); }}>
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div>
                            {blocks.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, color: '#cbd5e1', gap: 10 }}>
                                    <div style={{ width: 32, height: 42, border: '1.5px dashed #e2e8f0', borderRadius: 2 }} />
                                    <p style={{ fontSize: 9, textAlign: 'center', color: '#94a3b8' }}>Bileşenleri soldaki listeden sürükleyin</p>
                                </div>
                            ) : (
                                blocks.map(block => (
                                    <SortableBlock key={block.id} block={block} selected={selectedId === block.id} onClick={() => onSelectBlock(block.id)} />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </div>

                {/* Drop highlight when dragging over */}
                {isOver && (
                    <div style={{
                        position: 'absolute', bottom: mb + 4, left: ml, right: mr,
                        height: 2, background: '#3b82f6', borderRadius: 1,
                    }} />
                )}

                {/* Page label */}
                <div style={{ position: 'absolute', bottom: 5, right: 8, fontSize: 7, color: '#d1d5db', fontFamily: 'monospace' }}>
                    {pageSettings.page_size} · {pageSettings.orientation === 'portrait' ? 'Dikey' : 'Yatay'}
                </div>
            </div>
        </div>
    );
}

// ─── Page Settings Panel (with logo upload) ───────────────────────────

const PAGE_SIZES = Object.keys(PAGE_DIMENSIONS_MM) as Array<keyof typeof PAGE_DIMENSIONS_MM>;

function PageSettingsPanel({ settings, onChange, projectId }: {
    settings: PageSettings;
    onChange: (s: PageSettings) => void;
    projectId?: number | null;
}) {
    const set = <K extends keyof PageSettings>(key: K, val: PageSettings[K]) =>
        onChange({ ...settings, [key]: val });

    const lbl = 'block text-[9px] font-medium text-slate-500 mb-0.5';
    const inp = 'w-full text-xs rounded border border-slate-200 bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400';
    const numInp = `${inp} text-center`;

    // Logo upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !projectId) return;
        setLogoUploading(true);
        try {
            const fd = new FormData();
            fd.append('logo', file);
            const res = await api.post(`/projects/${projectId}/logo`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setLogoUrl(res.data.logo_url);
            toast.success('Logo yüklendi!');
        } catch {
            toast.error('Logo yüklenemedi.');
        } finally {
            setLogoUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-0 divide-y divide-slate-100">

            {/* Logo Upload */}
            <div className="p-3 space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Şirket Logosu</p>
                {logoUrl ? (
                    <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="Logo" className="h-10 object-contain rounded border border-slate-200 p-1 bg-white w-full" />
                        <button onClick={() => setLogoUrl(null)} className="absolute top-0.5 right-0.5 bg-white rounded-full p-0.5 text-slate-400 hover:text-red-500 transition-colors">
                            <X size={10} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!projectId || logoUploading}
                        className="w-full border border-dashed border-slate-300 rounded py-3 flex flex-col items-center gap-1 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {logoUploading
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Upload size={14} />}
                        <span className="text-[10px]">{logoUploading ? 'Yükleniyor…' : 'Logo Yükle'}</span>
                        <span className="text-[9px] text-slate-300">PNG, JPG, SVG · Maks 2MB</span>
                    </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {!projectId && <p className="text-[9px] text-amber-500">Logo için proje seçilmeli</p>}
            </div>

            {/* Page Size */}
            <div className="p-3 space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Sayfa Ayarları</p>

                <div>
                    <label className={lbl}>Sayfa Boyutu</label>
                    <select className={inp} value={settings.page_size}
                        onChange={e => set('page_size', e.target.value as PageSettings['page_size'])}>
                        {PAGE_SIZES.map(s => {
                            const d = PAGE_DIMENSIONS_MM[s];
                            return <option key={s} value={s}>{s} ({d.width}×{d.height}mm)</option>;
                        })}
                    </select>
                </div>

                {/* Orientation */}
                <div>
                    <label className={lbl}>Yön</label>
                    <div className="flex gap-1">
                        {(['portrait', 'landscape'] as const).map(o => (
                            <button key={o} onClick={() => set('orientation', o)}
                                className={`flex-1 text-[10px] py-1 rounded border font-medium transition-all ${settings.orientation === o ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                                {o === 'portrait' ? 'Dikey' : 'Yatay'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Margins */}
                <div>
                    <label className={lbl}>Kenar Boşlukları (mm)</label>
                    <div className="grid grid-cols-2 gap-1.5">
                        {([['margin_top', 'Üst'], ['margin_bottom', 'Alt'], ['margin_left', 'Sol'], ['margin_right', 'Sağ']] as const).map(([key, l]) => (
                            <div key={key}>
                                <label className="block text-[9px] text-slate-400 mb-0.5 text-center">{l}</label>
                                <input type="number" min={0} max={50} step={1} className={numInp}
                                    value={settings[key] as number}
                                    onChange={e => set(key, Number(e.target.value))} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Font size */}
                <div>
                    <label className={lbl}>Temel Font (pt)</label>
                    <input type="number" min={6} max={14} step={0.5} className={inp}
                        value={settings.font_size}
                        onChange={e => set('font_size', Number(e.target.value))} />
                </div>
            </div>
        </div>
    );
}

// ─── Main TemplateEditor ──────────────────────────────────────────────

interface TemplateEditorProps {
    initialConfig: TemplateConfig;
    templateType: 'offer' | 'invoice';
    projectId?: number | null;
}

let _ctr = 1000;
const genId = () => `b${++_ctr}_${Date.now()}`;
type RightPanel = 'block' | 'page';

export function TemplateEditor({ initialConfig, templateType, projectId }: TemplateEditorProps) {
    const [blocks, setBlocks] = useState<TemplateBlock[]>(initialConfig.blocks);
    const [pageSettings, setPageSettings] = useState<PageSettings>({
        ...DEFAULT_PAGE_SETTINGS, ...initialConfig.page_settings,
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [rightPanel, setRightPanel] = useState<RightPanel>('page');
    const [zoom, setZoom] = useState(0.72);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const { activeProject } = useProjectStore();

    useEffect(() => { if (selectedId) setRightPanel('block'); }, [selectedId]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
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
        setRightPanel('block');
    }, []);

    const removeBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        setSelectedId(prev => prev === id ? null : prev);
    }, []);

    const updateBlockSettings = useCallback((id: string, settings: Record<string, unknown>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, settings } : b));
    }, []);

    // ── DnD handlers ──────────────────────────────────────────────────

    const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveId(null);
        if (!over) return;

        const fromPalette = active.data.current?.fromPalette as boolean;

        if (fromPalette) {
            // Drop from palette → canvas
            const type = active.data.current?.type as BlockType;
            if (!type) return;
            if (over.id === 'a4-canvas') {
                // Dropped on empty canvas area — append at end
                addBlock(type);
            } else {
                // Dropped on a specific block — insert after it
                const overIndex = blocks.findIndex(b => b.id === over.id);
                addBlock(type, overIndex);
            }
        } else {
            // Reorder within canvas
            if (active.id !== over.id) {
                setBlocks(prev => {
                    const oi = prev.findIndex(b => b.id === active.id);
                    const ni = prev.findIndex(b => b.id === over.id);
                    return arrayMove(prev, oi, ni);
                });
            }
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
        } catch { toast.error('Kayıt başarısız.'); }
        finally { setSaving(false); }
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

    const { width: wMm, height: hMm } = PAGE_DIMENSIONS_MM[pageSettings.page_size];
    const dimLabel = pageSettings.orientation === 'portrait' ? `${wMm}×${hMm}mm` : `${hMm}×${wMm}mm`;

    return (
        // ⚠️ DndContext MUST wrap the entire layout including the BlockPalette
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={(_e: DragOverEvent) => { }}
        >
            <div className="flex flex-col h-full bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

                {/* Toolbar */}
                <div className="flex items-center justify-between h-10 px-3 border-b border-slate-200 bg-slate-50 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-slate-700 truncate">
                            {templateType === 'offer' ? 'Teklif Şablonu' : 'Fatura Şablonu'}
                        </span>
                        <span className="text-slate-300 text-xs">|</span>
                        <span className="text-[11px] text-slate-400 font-mono">{pageSettings.page_size} · {dimLabel}</span>
                        <span className="text-slate-300 text-xs">|</span>
                        <span className="text-[11px] text-slate-400">{blocks.length} blok</span>
                    </div>

                    {/* Zoom */}
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

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                        <button onClick={handleReset}
                            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 text-slate-500 border border-slate-200 rounded hover:bg-slate-100 transition-colors font-medium">
                            <RotateCcw size={11} /> Sıfırla
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className={`flex items-center gap-1.5 text-[11px] px-3 py-1 text-white rounded font-semibold transition-all ${saved ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {saving ? <Loader2 size={11} className="animate-spin" /> : saved ? <CheckCircle2 size={11} /> : <Save size={11} />}
                            {saved ? 'Kaydedildi' : 'Kaydet'}
                        </button>
                    </div>
                </div>

                {/* 3-pane */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left: palette — inside DndContext */}
                    <div className="w-48 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
                        <BlockPalette onAddBlock={addBlock} />
                    </div>

                    {/* Center: canvas */}
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

                    {/* Right: settings */}
                    <div className="w-56 shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
                        {/* Tab bar */}
                        <div className="flex border-b border-slate-200 shrink-0">
                            <button onClick={() => setRightPanel('block')}
                                className={`flex-1 text-[10px] font-semibold py-2 border-b-2 transition-colors ${rightPanel === 'block' ? 'border-blue-600 text-blue-600 bg-blue-50/40' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                                Blok Ayarları
                            </button>
                            <button onClick={() => setRightPanel('page')}
                                className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-2 border-b-2 transition-colors ${rightPanel === 'page' ? 'border-blue-600 text-blue-600 bg-blue-50/40' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                                <Settings size={10} /> Sayfa
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {rightPanel === 'block'
                                ? <BlockSettingsPanel block={selectedBlock} onUpdate={updateBlockSettings} onRemove={removeBlock} />
                                : <PageSettingsPanel settings={pageSettings} onChange={setPageSettings} projectId={projectId} />
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Drag overlay (floating ghost while dragging) */}
            <DragOverlay dropAnimation={null}>
                {activeDragMeta ? (
                    <div className="bg-white border border-blue-400 shadow-lg rounded px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700 opacity-90">
                        {activeDragMeta.label}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
