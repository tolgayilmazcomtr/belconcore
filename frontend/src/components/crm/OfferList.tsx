'use client';

import React, { useState, useMemo } from 'react';
import { Offer } from '@/types/project.types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Download,
    ChevronsUpDown,
    Search,
    MoreHorizontal,
    Edit2,
    Trash2,
    FileText,
    ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    SortingState,
    ColumnDef,
    FilterFn,
} from '@tanstack/react-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OfferCreateModal } from './OfferCreateModal';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useCrmStore } from '@/store/useCrmStore';

interface OfferListProps {
    offers: Offer[];
    projectName?: string;
    onRowClick?: (offer: Offer) => void;
}

const OFFER_STATUS_MAP: Record<string, { label: string; className: string }> = {
    draft: { label: 'Taslak', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    sent: { label: 'Gönderildi', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    accepted: { label: 'Kabul Edildi', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-600 border-red-200' },
};

const formatMoney = (amount?: number | null) => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const multiColumnFilterFn: FilterFn<Offer> = (row, _columnId, value) => {
    const search = value.toLowerCase();
    const offer = row.original;
    const customerName = offer.customer
        ? (offer.customer.type === 'corporate' ? offer.customer.company_name : `${offer.customer.first_name} ${offer.customer.last_name}`)
        : '';
    return (
        offer.offer_no?.toLowerCase().includes(search) ||
        (customerName?.toLowerCase().includes(search) ?? false)
    );
};

export function OfferList({ offers, projectName, onRowClick }: OfferListProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const { setOffers } = useCrmStore();

    const handlePdf = async (offer: Offer, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await api.get(`/offers/${offer.id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Teklif_${offer.offer_no}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('PDF indirilemedi');
        }
    };

    const handleDelete = async (offerId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Bu teklifi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
        try {
            await api.delete(`/offers/${offerId}`);
            setOffers(offers.filter(o => o.id !== offerId));
            toast.success('Teklif silindi');
        } catch (error: any) {
            toast.error('Hata', { description: error.response?.data?.message || 'Silinirken bir hata oluştu.' });
        }
    };

    const handleExport = () => {
        const rows = table.getFilteredRowModel().rows.map(r => r.original);
        const data = rows.map(o => ({
            'Teklif No': o.offer_no,
            'Müşteri': o.customer
                ? (o.customer.type === 'corporate' ? o.customer.company_name : `${o.customer.first_name} ${o.customer.last_name}`)
                : '-',
            'Durum': OFFER_STATUS_MAP[o.status]?.label || o.status,
            'Baz Fiyat': o.base_price,
            'İndirim': o.discount_amount,
            'Net Fiyat': o.final_price,
            'Geçerlilik': o.valid_until || '-',
            'Oluşturma': o.created_at ? new Date(o.created_at).toLocaleDateString('tr-TR') : '-',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Teklifler');
        XLSX.writeFile(wb, `${projectName || 'Belcon'}_Teklifler_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const columns = useMemo<ColumnDef<Offer>[]>(() => [
        {
            accessorKey: 'offer_no',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    TEKLİF NO <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded text-primary">
                        <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">{row.getValue('offer_no')}</span>
                </div>
            ),
            size: 180,
        },
        {
            id: 'customer',
            accessorFn: (row) => row.customer
                ? (row.customer.type === 'corporate' ? row.customer.company_name : `${row.customer.first_name} ${row.customer.last_name}`)
                : '-',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    MÜŞTERİ <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="font-medium text-slate-700">{row.getValue('customer')}</span>,
            size: 200,
        },
        {
            id: 'unit',
            accessorFn: (row) => row.unit ? `${(row.unit as any).block?.name || '?'} / ${row.unit.unit_no}` : '-',
            header: () => <span className="text-xs font-semibold">ÜNİTE</span>,
            cell: ({ row }) => <span className="text-slate-500 text-sm">{row.getValue('unit')}</span>,
            size: 130,
        },
        {
            accessorKey: 'base_price',
            header: ({ column }) => (
                <div className="text-right">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                        BAZ FİYAT <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => <div className="text-right text-slate-600 text-sm">{formatMoney(row.getValue('base_price'))}</div>,
            size: 140,
        },
        {
            accessorKey: 'discount_amount',
            header: () => <div className="text-right text-xs font-semibold">İNDİRİM</div>,
            cell: ({ row }) => {
                const val = row.getValue<number>('discount_amount');
                return (
                    <div className="text-right text-sm">
                        {val > 0 ? <span className="text-red-500 font-medium">-{formatMoney(val)}</span> : <span className="text-slate-400">-</span>}
                    </div>
                );
            },
            size: 120,
        },
        {
            accessorKey: 'final_price',
            header: ({ column }) => (
                <div className="text-right">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                        NET FİYAT <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-right font-bold text-slate-800">{formatMoney(row.getValue('final_price'))}</div>
            ),
            size: 140,
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    DURUM <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const status = row.getValue<string>('status');
                const cfg = OFFER_STATUS_MAP[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
                return <Badge variant="outline" className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
            },
            size: 130,
        },
        {
            accessorKey: 'valid_until',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    GEÇERLİLİK <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const val = row.getValue<string | null>('valid_until');
                if (!val) return <span className="text-slate-400 text-sm">-</span>;
                const date = new Date(val);
                const isExpired = date < new Date();
                return (
                    <span className={`text-sm ${isExpired ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                        {date.toLocaleDateString('tr-TR')}
                    </span>
                );
            },
            size: 120,
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const offer = row.original;
                // We need a dummy lead object for OfferCreateModal edit mode
                const fakeLead = { id: offer.lead_id, customer_id: offer.customer_id, title: offer.offer_no } as any;
                return (
                    <div className="flex items-center justify-end gap-1.5 pr-2" onClick={e => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/5"
                            title="PDF İndir"
                            onClick={(e) => handlePdf(offer, e)}
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                    <span className="sr-only">Menüyü aç</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <OfferCreateModal
                                    lead={fakeLead}
                                    editOffer={offer}
                                    trigger={
                                        <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()} className="cursor-pointer">
                                            <Edit2 className="mr-2 h-4 w-4" />
                                            <span>Düzenle</span>
                                        </DropdownMenuItem>
                                    }
                                />
                                <DropdownMenuItem
                                    onClick={(e) => handleDelete(offer.id, e)}
                                    className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Sil</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            size: 80,
        },
    ], [offers]);

    const table = useReactTable({
        data: offers,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: multiColumnFilterFn,
        getFilteredRowModel: getFilteredRowModel(),
        state: { sorting, globalFilter },
    });

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div className="relative w-[340px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Teklif no veya müşteri adıyla ara..."
                        value={globalFilter ?? ''}
                        onChange={e => setGlobalFilter(e.target.value)}
                        className="h-9 pl-9 w-full bg-white text-sm shadow-sm"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} className="h-9 shadow-sm text-sm font-medium">
                    <Download className="mr-2 h-4 w-4 text-slate-500" /> Dışa Aktar
                </Button>
            </div>

            {/* Table */}
            <div className="flex-auto overflow-auto relative bg-white">
                <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                                {headerGroup.headers.map(header => (
                                    <TableHead
                                        key={header.id}
                                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                        className="h-11 text-slate-600 font-semibold"
                                    >
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow
                                    key={row.id}
                                    onClick={() => onRowClick && onRowClick(row.original)}
                                    className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id} className="py-3 px-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-36 text-center text-slate-500 bg-slate-50/30">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <FileText className="h-8 w-8 text-slate-300" />
                                        <p>Teklif bulunamadı.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center shrink-0">
                <span>Toplam {table.getFilteredRowModel().rows.length} teklif listeleniyor</span>
            </div>
        </div>
    );
}
