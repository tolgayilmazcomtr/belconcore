'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/project.types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useCrmStore } from '@/store/useCrmStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Clock, Phone, Mail, MessageSquare, MoreHorizontal, User, Building } from 'lucide-react';

const COLUMNS = [
    { id: 'new', title: 'Yeni', color: 'bg-blue-100/50', headerColor: 'border-blue-200', dotColor: 'bg-blue-500' },
    { id: 'contacted', title: 'İletişime Geçildi', color: 'bg-amber-100/50', headerColor: 'border-amber-200', dotColor: 'bg-amber-500' },
    { id: 'qualified', title: 'Nitelikli/İlgili', color: 'bg-indigo-100/50', headerColor: 'border-indigo-200', dotColor: 'bg-indigo-500' },
    { id: 'proposal', title: 'Teklif Verildi', color: 'bg-purple-100/50', headerColor: 'border-purple-200', dotColor: 'bg-purple-500' },
    { id: 'won', title: 'Kazanıldı (Satış)', color: 'bg-emerald-100/50', headerColor: 'border-emerald-200', dotColor: 'bg-emerald-500' },
    { id: 'lost', title: 'Kaybedildi', color: 'bg-red-100/50', headerColor: 'border-red-200', dotColor: 'bg-red-500' },
];

interface LeadKanbanBoardProps {
    onLeadClick: (lead: Lead) => void;
}

export function LeadKanbanBoard({ onLeadClick }: LeadKanbanBoardProps) {
    const { leads, setLeads } = useCrmStore();

    // Group leads by status
    const groupedLeads = COLUMNS.reduce((acc, col) => {
        acc[col.id] = leads.filter(l => l.status === col.id).sort((a, b) => {
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        return acc;
    }, {} as Record<string, Lead[]>);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return; // Dropped outside
        if (source.droppableId === destination.droppableId && source.index === destination.index) return; // No change

        const leadId = parseInt(draggableId);
        const newStatus = destination.droppableId as Lead['status'];

        // Optimistic UI update
        const updatedLeads = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
        setLeads(updatedLeads);

        try {
            await api.put(`/leads/${leadId}/status`, { status: newStatus });
        } catch (error) {
            toast.error("Durum güncellenemedi.");
            // Revert on error
            setLeads(leads);
        }
    };

    // Format money
    const formatMoney = (amount?: number) => {
        if (!amount) return null;
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full overflow-x-auto overflow-y-hidden gap-4 p-4 pb-2 items-start bg-slate-50/50">
                {COLUMNS.map(col => (
                    <div key={col.id} className="flex flex-col min-w-[300px] max-w-[300px] h-full shrink-0">
                        {/* Column Header */}
                        <div className={`
                            flex items-center justify-between px-3 py-2 mb-3
                            bg-white rounded-lg border shadow-sm ${col.headerColor}
                        `}>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                                <h3 className="font-semibold text-slate-800 tracking-tight">{col.title}</h3>
                            </div>
                            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {groupedLeads[col.id].length}
                            </span>
                        </div>

                        {/* Droppable Area */}
                        <Droppable droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`
                                        flex-1 overflow-y-auto rounded-lg p-2
                                        transition-colors duration-200 border-2 border-transparent
                                        ${snapshot.isDraggingOver ? 'bg-slate-100 border-dashed border-slate-300' : col.color}
                                    `}
                                    style={{ minHeight: '150px' }}
                                >
                                    <div className="space-y-3">
                                        {groupedLeads[col.id].map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => onLeadClick(lead)}
                                                        className={`
                                                            bg-white p-3.5 rounded-lg border border-slate-200
                                                            hover:border-primary/50 transition-all cursor-pointer group select-none
                                                            ${snapshot.isDragging ? 'shadow-lg ring-1 ring-primary rotate-2 scale-105' : 'shadow-sm hover:shadow-md'}
                                                        `}
                                                        style={{ ...provided.draggableProps.style }}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-semibold text-slate-800 text-sm leading-tight group-hover:text-primary transition-colors pr-2">
                                                                {lead.title}
                                                            </h4>
                                                            <MoreHorizontal className="w-4 h-4 text-slate-300 shrink-0" />
                                                        </div>

                                                        {lead.customer && (
                                                            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
                                                                {lead.customer.type === 'corporate' ? <Building className="w-3.5 h-3.5 text-blue-500" /> : <User className="w-3.5 h-3.5 text-emerald-500" />}
                                                                <span className="truncate">
                                                                    {lead.customer.type === 'corporate' ? lead.customer.company_name : `${lead.customer.first_name} ${lead.customer.last_name}`}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                                            <span className="text-[11px] font-medium text-slate-400">
                                                                {new Date(lead.created_at || '').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                            {lead.expected_value ? (
                                                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                                                    {formatMoney(lead.expected_value)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">Tutar Belirtilmemiş</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
