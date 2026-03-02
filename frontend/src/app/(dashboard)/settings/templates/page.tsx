'use client';

import React, { useEffect, useState } from 'react';
import { TemplateEditor } from '@/components/settings/template-builder/TemplateEditor';
import { TemplateConfig, DEFAULT_PAGE_SETTINGS } from '@/components/settings/template-builder/types';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { Loader2, FileText, Receipt, LayoutTemplate } from 'lucide-react';

const TEMPLATE_TYPES: { type: 'offer' | 'invoice'; label: string; icon: React.ElementType; sub: string }[] = [
    { type: 'offer', label: 'Teklif Şablonu', icon: FileText, sub: 'Satış teklifleri için şablon' },
    { type: 'invoice', label: 'Fatura Şablonu', icon: Receipt, sub: 'Proforma fatura şablonu' },
];

export default function TemplatesPage() {
    const { activeProject } = useProjectStore();
    const [selectedType, setSelectedType] = useState<'offer' | 'invoice'>('offer');
    const [config, setConfig] = useState<TemplateConfig | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeProject) return;
        setLoading(true);
        setConfig(null);

        api.get(`/template-configs/${selectedType}`, {
            params: activeProject?.id ? { project_id: activeProject.id } : {},
        })
            .then(r => setConfig(r.data.data))
            .catch(() => setConfig({
                type: selectedType,
                name: 'Varsayılan Şablon',
                project_id: activeProject?.id ?? null,
                blocks: [],
                page_settings: DEFAULT_PAGE_SETTINGS,
            }))
            .finally(() => setLoading(false));
    }, [selectedType, activeProject]);

    if (!activeProject) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <LayoutTemplate className="w-8 h-8 opacity-25" />
                <p className="text-sm">Şablon düzenlemek için önce bir proje seçin.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Type selector */}
            <div className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Şablon Editörü</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">Proje: {activeProject.name}</p>
                </div>

                <nav className="flex-1 p-2 space-y-0.5">
                    {TEMPLATE_TYPES.map(t => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.type}
                                onClick={() => setSelectedType(t.type)}
                                className={`w-full flex items-center gap-2.5 rounded px-3 py-2 text-left transition-all ${selectedType === t.type
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <Icon size={14} strokeWidth={1.75} className="shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold leading-tight truncate">{t.label}</p>
                                    <p className={`text-[9px] leading-tight mt-0.5 truncate ${selectedType === t.type ? 'text-blue-100' : 'text-slate-400'}`}>{t.sub}</p>
                                </div>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-slate-200 bg-slate-50">
                    <div className="rounded border border-blue-200 bg-blue-50 px-2.5 py-2">
                        <p className="text-[10px] font-semibold text-blue-700 mb-0.5">Kullanım</p>
                        <p className="text-[9px] text-blue-600 leading-relaxed">
                            Bileşeni soldaki listeden A4 kanvasa sürükleyin. Seçili bileşenin ayarlarını sağ panelden düzenleyin.
                        </p>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center h-full bg-[#e8eaed]">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            <p className="text-xs">Şablon yükleniyor…</p>
                        </div>
                    </div>
                ) : config ? (
                    <TemplateEditor
                        key={`${selectedType}-${activeProject.id}`}
                        initialConfig={config}
                        templateType={selectedType}
                        projectId={activeProject.id}
                    />
                ) : null}
            </div>
        </div>
    );
}
