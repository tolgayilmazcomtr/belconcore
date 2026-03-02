'use client';

import React, { useEffect, useState } from 'react';
import { TemplateEditor } from '@/components/settings/template-builder/TemplateEditor';
import { TemplateConfig } from '@/components/settings/template-builder/types';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { Loader2, FileText, Receipt } from 'lucide-react';

const TEMPLATE_TYPES: { type: 'offer' | 'invoice'; label: string; icon: React.ReactNode; description: string }[] = [
    {
        type: 'offer',
        label: 'Teklif Şablonu',
        icon: <FileText className="w-5 h-5" />,
        description: 'Müşterilere gönderilen satış teklifleri',
    },
    {
        type: 'invoice',
        label: 'Fatura Şablonu',
        icon: <Receipt className="w-5 h-5" />,
        description: 'Proforma veya resmi fatura belgeleri',
    },
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

        const params = activeProject?.id ? { project_id: activeProject.id } : {};

        api.get(`/template-configs/${selectedType}`, { params })
            .then(r => setConfig(r.data.data))
            .catch(() => {
                // Fallback to empty config if endpoint unavailable
                setConfig({
                    type: selectedType,
                    name: 'Varsayılan Şablon',
                    project_id: activeProject?.id ?? null,
                    blocks: [],
                    page_settings: { margin: 14, font_size: 9 },
                });
            })
            .finally(() => setLoading(false));
    }, [selectedType, activeProject]);

    // Landing when no project selected
    if (!activeProject) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <FileText className="w-8 h-8 opacity-30" />
                <p className="text-sm">Şablon düzenlemek için önce bir proje seçin.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-slate-50">
            {/* Template type selector sidebar */}
            <div className="w-60 shrink-0 border-r bg-white flex flex-col shadow-sm">
                <div className="px-5 py-5 border-b">
                    <h1 className="text-base font-bold text-slate-800">Şablon Editörü</h1>
                    <p className="text-xs text-slate-400 mt-1">Proje: <span className="font-medium text-slate-600">{activeProject.name}</span></p>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    {TEMPLATE_TYPES.map(t => (
                        <button
                            key={t.type}
                            onClick={() => setSelectedType(t.type)}
                            className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all ${selectedType === t.type
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                                }`}
                        >
                            <span className={`mt-0.5 shrink-0 ${selectedType === t.type ? 'text-primary' : 'text-slate-400'}`}>
                                {t.icon}
                            </span>
                            <div>
                                <p className="text-sm font-semibold leading-tight">{t.label}</p>
                                <p className="text-xs opacity-70 mt-0.5 leading-tight">{t.description}</p>
                            </div>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1">💡 İpucu</p>
                        <p className="text-[11px] text-blue-600 leading-relaxed">
                            Blokları soldan sürükleyip A4 kanvas üzerine bırakın. Bloka tıklayıp sağ panelden özelleştirin.
                        </p>
                    </div>
                </div>
            </div>

            {/* Editor area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center h-full bg-slate-100">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                            <p className="text-sm">Şablon yükleniyor…</p>
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
