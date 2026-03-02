'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
    Image, Building2, User, FileText, LayoutGrid, Home,
    Table2, CalendarClock, CreditCard, StickyNote, PenLine,
    Minus, Type, PanelBottom, ChevronRight,
} from 'lucide-react';
import { BLOCK_CATALOGUE, CATEGORY_LABELS, BlockType } from './types';

// Map block types to Lucide icons
const BLOCK_ICONS: Record<string, React.ElementType> = {
    LogoBlock: Image,
    CompanyInfoBlock: Building2,
    ClientInfoBlock: User,
    OfferMetaBlock: FileText,
    InfoGridBlock: LayoutGrid,
    UnitInfoBlock: Home,
    PricingTableBlock: Table2,
    ValidityBlock: CalendarClock,
    PaymentPlanBlock: CreditCard,
    NotesBlock: StickyNote,
    SignatureBlock: PenLine,
    DividerBlock: Minus,
    TextBlock: Type,
    FooterBlock: PanelBottom,
};

interface BlockPaletteProps {
    onAddBlock: (type: BlockType) => void;
}

function DraggablePaletteItem({ type, label, description }: {
    type: BlockType;
    label: string;
    description: string;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${type}`,
        data: { type, fromPalette: true },
    });

    const Icon = BLOCK_ICONS[type] ?? FileText;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{ opacity: isDragging ? 0.35 : 1 }}
            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing select-none border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all group"
        >
            <div className="shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                <Icon size={13} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-700 group-hover:text-blue-700 leading-tight transition-colors truncate">{label}</p>
            </div>
            <ChevronRight size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
    );
}

export function BlockPalette({ onAddBlock: _ }: BlockPaletteProps) {
    const categories = Array.from(new Set(BLOCK_CATALOGUE.map(b => b.category)));

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-3 py-2.5 border-b bg-slate-50 shrink-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Bileşenler</p>
            </div>

            {/* Block list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
                {categories.map(cat => (
                    <div key={cat}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-2 mb-1">
                            {CATEGORY_LABELS[cat] ?? cat}
                        </p>
                        <div className="space-y-0.5">
                            {BLOCK_CATALOGUE.filter(b => b.category === cat).map(item => (
                                <DraggablePaletteItem
                                    key={item.type}
                                    type={item.type}
                                    label={item.label}
                                    description={item.description}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t bg-slate-50 shrink-0">
                <p className="text-[9px] text-slate-400 leading-relaxed">Kanvasa sürükleyerek ekleyin</p>
            </div>
        </div>
    );
}
