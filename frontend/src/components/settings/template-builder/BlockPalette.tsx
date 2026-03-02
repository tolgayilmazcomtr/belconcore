'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { BLOCK_CATALOGUE, CATEGORY_LABELS, BlockType } from './types';

interface BlockPaletteProps {
    onAddBlock: (type: BlockType) => void;
}

function DraggablePaletteItem({ type, label, description, icon }: {
    type: BlockType;
    label: string;
    description: string;
    icon: string;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${type}`,
        data: { type, fromPalette: true },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{ opacity: isDragging ? 0.4 : 1 }}
            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-white hover:border-primary/40 hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-all select-none group"
        >
            <span className="text-base shrink-0 mt-0.5">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700 group-hover:text-primary transition-colors leading-tight">{label}</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">{description}</p>
            </div>
        </div>
    );
}

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
    // Group by category
    const categories = Array.from(new Set(BLOCK_CATALOGUE.map(b => b.category)));

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b bg-slate-50 shrink-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloklar</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Sürükleyip şablona ekleyin</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {categories.map(cat => (
                    <div key={cat}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
                            {CATEGORY_LABELS[cat] ?? cat}
                        </p>
                        <div className="space-y-1">
                            {BLOCK_CATALOGUE.filter(b => b.category === cat).map(item => (
                                <DraggablePaletteItem
                                    key={item.type}
                                    type={item.type}
                                    label={item.label}
                                    description={item.description}
                                    icon={item.icon}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 border-t shrink-0">
                <p className="text-[10px] text-slate-400 text-center">Veya bloğa çift tıklayarak ekleyin</p>
            </div>
        </div>
    );
}
