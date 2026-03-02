'use client';

import React, { useRef, useState } from 'react';
import { TemplateBlock, BLOCK_CATALOGUE, getBlockCatalogueItem, SettingField } from './types';
import { X, Settings2, Palette, ChevronDown, ChevronUp } from 'lucide-react';

interface BlockSettingsPanelProps {
    block: TemplateBlock | null;
    onUpdate: (blockId: string, settings: Record<string, unknown>) => void;
    onRemove: (blockId: string) => void;
}

// ─── Advanced style fields always available for every block ──────────
const STYLE_FIELDS: SettingField[] = [
    { key: '_bg_color', label: 'Arka Plan Rengi', type: 'color' },
    { key: '_text_color', label: 'Yazı Rengi', type: 'color' },
    { key: '_font_size', label: 'Font Boyutu (pt)', type: 'number', min: 6, max: 20 },
    {
        key: '_font_weight', label: 'Font Kalınlığı', type: 'select',
        options: [{ value: 'normal', label: 'Normal' }, { value: 'bold', label: 'Kalın' }]
    },
    { key: '_border_width', label: 'Kenarlık Kalınlığı (px)', type: 'number', min: 0, max: 8 },
    { key: '_border_color', label: 'Kenarlık Rengi', type: 'color' },
    { key: '_padding', label: 'İç Boşluk (mm)', type: 'number', min: 0, max: 20 },
    { key: '_margin_top', label: 'Üst Boşluk (mm)', type: 'number', min: 0, max: 30 },
    { key: '_margin_bottom', label: 'Alt Boşluk (mm)', type: 'number', min: 0, max: 30 },
];

export function BlockSettingsPanel({ block, onUpdate, onRemove }: BlockSettingsPanelProps) {
    const [styleOpen, setStyleOpen] = useState(false);

    if (!block) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 p-5 text-center gap-2.5">
                <Settings2 size={22} strokeWidth={1.5} />
                <p className="text-xs text-slate-400">Ayarlamak için bir blok seçin</p>
            </div>
        );
    }

    const meta = getBlockCatalogueItem(block.type);
    const handleChange = (key: string, value: unknown) =>
        onUpdate(block.id, { ...block.settings, [key]: value });

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b bg-slate-50 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <Settings2 size={12} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 truncate">{meta.label}</p>
                        <p className="text-[9px] text-slate-400 truncate leading-tight">{meta.description}</p>
                    </div>
                </div>
                <button
                    onClick={() => onRemove(block.id)}
                    className="shrink-0 p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                    title="Bloğu kaldır"
                >
                    <X size={13} />
                </button>
            </div>

            {/* Scrollable settings */}
            <div className="flex-1 overflow-y-auto">

                {/* Block-specific settings */}
                {meta.settingsSchema.length > 0 && (
                    <div className="px-3 py-3 space-y-3 border-b">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">İçerik Ayarları</p>
                        {meta.settingsSchema.map(field => (
                            <SettingControl key={field.key} field={field} value={block.settings[field.key]} onChange={v => handleChange(field.key, v)} />
                        ))}
                    </div>
                )}

                {/* Advanced style settings */}
                <div className="border-b">
                    <button
                        onClick={() => setStyleOpen(o => !o)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-1.5">
                            <Palette size={11} className="text-slate-400" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Stil &amp; Görünüm</span>
                        </div>
                        {styleOpen ? <ChevronUp size={11} className="text-slate-300" /> : <ChevronDown size={11} className="text-slate-300" />}
                    </button>

                    {styleOpen && (
                        <div className="px-3 pb-3 space-y-3">
                            {STYLE_FIELDS.map(field => (
                                <SettingControl key={field.key} field={field} value={block.settings[field.key]} onChange={v => handleChange(field.key, v)} />
                            ))}
                            {/* Reset styles */}
                            <button
                                onClick={() => {
                                    const cleaned = { ...block.settings };
                                    STYLE_FIELDS.forEach(f => { delete cleaned[f.key]; });
                                    onUpdate(block.id, cleaned);
                                }}
                                className="w-full text-[10px] py-1 rounded border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
                            >
                                Stili Sıfırla
                            </button>
                        </div>
                    )}
                </div>

                {meta.settingsSchema.length === 0 && !styleOpen && (
                    <p className="text-[10px] text-slate-400 text-center py-4 px-3">Stil &amp; Görünüm bölümünü açarak özelleştirin</p>
                )}
            </div>
        </div>
    );
}

// ─── Generic setting control renderer ────────────────────────────────

function SettingControl({ field, value, onChange }: {
    field: SettingField;
    value: unknown;
    onChange: (v: unknown) => void;
}) {
    const lbl = 'block text-[9px] font-medium text-slate-500 mb-0.5';
    const inp = 'w-full text-xs rounded border border-slate-200 bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors';

    switch (field.type) {
        case 'text':
            return (
                <div>
                    <label className={lbl}>{field.label}</label>
                    <textarea className={`${inp} resize-none`} rows={2}
                        value={(value as string) ?? ''}
                        onChange={e => onChange(e.target.value)} />
                </div>
            );
        case 'select':
            return (
                <div>
                    <label className={lbl}>{field.label}</label>
                    <select className={inp} value={(value as string) ?? ''}
                        onChange={e => onChange(e.target.value)}>
                        {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            );
        case 'number':
            return (
                <div>
                    <label className={lbl}>{field.label}</label>
                    <input type="number" className={inp} min={field.min} max={field.max}
                        value={(value as number) ?? (field.min ?? 0)}
                        onChange={e => onChange(Number(e.target.value))} />
                </div>
            );
        case 'color':
            return (
                <div>
                    <label className={lbl}>{field.label}</label>
                    <div className="flex items-center gap-1.5">
                        <input type="color"
                            className="h-6 w-9 rounded border border-slate-200 cursor-pointer p-0.5 shrink-0"
                            value={(value as string) || '#ffffff'}
                            onChange={e => onChange(e.target.value)} />
                        <input type="text" className={`${inp} flex-1`}
                            value={(value as string) ?? ''}
                            placeholder="örn: #0f172a"
                            onChange={e => onChange(e.target.value)} />
                        {!!value && (
                            <button onClick={() => onChange(undefined)}
                                className="text-slate-300 hover:text-red-400 shrink-0">
                                <X size={11} />
                            </button>
                        )}
                    </div>
                </div>
            );
        case 'boolean':
            return (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div className="relative shrink-0">
                        <input type="checkbox" className="sr-only peer"
                            checked={(value as boolean) ?? true}
                            onChange={e => onChange(e.target.checked)} />
                        <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-blue-500 transition-colors" />
                        <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                    </div>
                    <span className="text-[11px] text-slate-700">{field.label}</span>
                </label>
            );
        default:
            return null;
    }
}
