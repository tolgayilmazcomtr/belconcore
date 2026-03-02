'use client';

import React from 'react';
import { TemplateBlock, BLOCK_CATALOGUE, getBlockCatalogueItem, SettingField } from './types';
import { X, Settings2 } from 'lucide-react';

interface BlockSettingsPanelProps {
    block: TemplateBlock | null;
    onUpdate: (blockId: string, settings: Record<string, unknown>) => void;
    onRemove: (blockId: string) => void;
}

export function BlockSettingsPanel({ block, onUpdate, onRemove }: BlockSettingsPanelProps) {
    if (!block) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center gap-3">
                <Settings2 className="w-8 h-8 opacity-30" />
                <p className="text-sm">Bir blok seçerek ayarlarını buradan düzenleyebilirsiniz.</p>
            </div>
        );
    }

    const meta = getBlockCatalogueItem(block.type);

    const handleChange = (key: string, value: unknown) => {
        onUpdate(block.id, { ...block.settings, [key]: value });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">{meta.label}</p>
                        <p className="text-xs text-slate-400">{meta.description}</p>
                    </div>
                </div>
                <button
                    onClick={() => onRemove(block.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Bloğu sil"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Settings */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {meta.settingsSchema.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Bu blok için özelleştirilebilir ayar bulunmuyor.</p>
                ) : (
                    meta.settingsSchema.map(field => (
                        <SettingControl
                            key={field.key}
                            field={field}
                            value={block.settings[field.key]}
                            onChange={(v) => handleChange(field.key, v)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function SettingControl({ field, value, onChange }: {
    field: SettingField;
    value: unknown;
    onChange: (v: unknown) => void;
}) {
    const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
    const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

    switch (field.type) {
        case 'text':
            return (
                <div>
                    <label className={labelClass}>{field.label}</label>
                    <textarea
                        className={`${inputClass} resize-none`}
                        rows={3}
                        value={(value as string) ?? ''}
                        onChange={e => onChange(e.target.value)}
                    />
                </div>
            );

        case 'select':
            return (
                <div>
                    <label className={labelClass}>{field.label}</label>
                    <select
                        className={inputClass}
                        value={(value as string) ?? ''}
                        onChange={e => onChange(e.target.value)}
                    >
                        {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            );

        case 'number':
            return (
                <div>
                    <label className={labelClass}>{field.label}</label>
                    <input
                        type="number"
                        className={inputClass}
                        min={field.min}
                        max={field.max}
                        value={(value as number) ?? 0}
                        onChange={e => onChange(Number(e.target.value))}
                    />
                </div>
            );

        case 'color':
            return (
                <div>
                    <label className={labelClass}>{field.label}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            className="h-8 w-12 rounded border border-slate-200 cursor-pointer p-0.5"
                            value={(value as string) ?? '#000000'}
                            onChange={e => onChange(e.target.value)}
                        />
                        <input
                            type="text"
                            className={`${inputClass} flex-1`}
                            value={(value as string) ?? ''}
                            onChange={e => onChange(e.target.value)}
                        />
                    </div>
                </div>
            );

        case 'boolean':
            return (
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={(value as boolean) ?? true}
                            onChange={e => onChange(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-primary transition-colors" />
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                    </div>
                    <span className="text-sm text-slate-700">{field.label}</span>
                </label>
            );

        default:
            return null;
    }
}
