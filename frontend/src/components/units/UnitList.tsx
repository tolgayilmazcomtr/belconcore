'use client';

import React, { useState, useMemo } from 'react';
import { Unit } from '@/types/project.types';
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
import { Download, ChevronsUpDown, Search, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    SortingState,
    ColumnDef,
    FilterFn
} from '@tanstack/react-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UnitCreateModal } from './UnitCreateModal';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/useProjectStore';

interface UnitListProps {
    units: Unit[];
    projectName: string;
}

const multiColumnFilterFn: FilterFn<Unit> = (row, columnId, value, addMeta) => {
    const searchStr = value.toLowerCase();
    const unitNo = (row.getValue('unit_no') as string)?.toLowerCase() || '';
    const blockCode = (row.original.block?.code as string)?.toLowerCase() || '';
    const type = (row.getValue('unit_type') as string)?.toLowerCase() || '';

    return unitNo.includes(searchStr) || blockCode.includes(searchStr) || type.includes(searchStr);
};

export function UnitList({ units, projectName }: UnitListProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const { setUnits } = useProjectStore();

    const handleExport = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const rowsToExport = selectedRows.length > 0
            ? selectedRows.map(r => r.original)
            : table.getFilteredRowModel().rows.map(r => r.original);

        const exportData = rowsToExport.map(u => ({
            'Blok': u.block?.code || '-',
            'Bağımsız Bölüm No': u.unit_no,
            'Kat': u.floor_no || '-',
            'Tip': u.unit_type || '-',
            'Brüt Alan (m²)': u.gross_area || '-',
            'Net Alan (m²)': u.net_area || '-',
            'Liste Fiyatı': u.list_price ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(u.list_price) : '-',
            'Durum': getStatusLabel(u.status),
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Üniteler");
        XLSX.writeFile(wb, `${projectName}_Uniteler_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleDelete = async (unitId: number) => {
        if (!confirm("Bu üniteyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
        try {
            await api.delete(`/units/${unitId}`);
            setUnits(units.filter(u => u.id !== unitId));
            toast.success("Silindi", { description: "Ünite başarıyla silindi." });
        } catch (error: any) {
            toast.error("Hata", { description: error.response?.data?.message || "Silinirken bir hata oluştu." });
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'available': return 'default';
            case 'sold': return 'destructive';
            case 'reserved': return 'secondary';
            case 'not_for_sale': return 'outline';
            default: return 'outline';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'available': return 'Satışa Uygun';
            case 'sold': return 'Satıldı';
            case 'reserved': return 'Rezerve';
            case 'not_for_sale': return 'Satışa Kapalı';
            default: return status;
        }
    };

    const columns = useMemo<ColumnDef<Unit>[]>(() => [
        {
            id: 'select',
            header: ({ table }) => (
                <input
                    type="checkbox"
                    className="rounded border-slate-300 w-4 h-4 cursor-pointer"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                />
            ),
            cell: ({ row }) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        className="rounded border-slate-300 w-4 h-4 cursor-pointer"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                </div>
            ),
            size: 40,
        },
        {
            accessorKey: 'block_id',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    BLOK
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="text-slate-500 font-medium">{row.original.block?.code || '-'}</span>,
            size: 100,
        },
        {
            accessorKey: 'unit_no',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    KAPI NO
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue('unit_no')}</span>,
            size: 100,
        },
        {
            accessorKey: 'floor_no',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    KAT
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="text-slate-600">{row.getValue('floor_no') || '-'}</span>,
            size: 80,
        },
        {
            accessorKey: 'unit_type',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    TİP
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="text-slate-600">{row.getValue('unit_type') || '-'}</span>,
            size: 80,
        },
        {
            accessorKey: 'gross_area',
            header: ({ column }) => (
                <div className="flex justify-end pr-2">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                        BRÜT (m²)
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => <div className="text-right text-slate-600 pr-2">{row.getValue('gross_area') || '-'}</div>,
            size: 110,
        },
        {
            accessorKey: 'net_area',
            header: ({ column }) => (
                <div className="flex justify-end pr-2">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                        NET (m²)
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => <div className="text-right text-slate-600 pr-2">{row.getValue('net_area') || '-'}</div>,
            size: 110,
        },
        {
            accessorKey: 'list_price',
            header: ({ column }) => (
                <div className="flex justify-end pr-2">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                        LİSTE FİYATI
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("list_price"));
                const formatted = isNaN(amount) ? '-' : new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                }).format(amount);
                return <div className="text-right font-medium pr-2 text-slate-800">{formatted}</div>
            },
            size: 140,
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    DURUM
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return (
                    <Badge variant={getStatusVariant(status) as any} className="shadow-sm font-medium">
                        {getStatusLabel(status)}
                    </Badge>
                )
            },
            size: 130,
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const unit = row.original;
                return (
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
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
                                <UnitCreateModal
                                    editUnit={unit}
                                    trigger={
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                            <Edit2 className="mr-2 h-4 w-4" />
                                            <span>Düzenle</span>
                                        </DropdownMenuItem>
                                    }
                                />
                                <DropdownMenuItem onClick={() => handleDelete(unit.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Sil</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
            size: 40,
        }
    ], [units, setUnits]);

    const table = useReactTable({
        data: units,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: multiColumnFilterFn,
        getFilteredRowModel: getFilteredRowModel(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
    });

    return (
        <div className="flex flex-col h-full bg-white rounded-md shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b bg-slate-50/50">
                <div className="relative group w-[320px]">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Kapı No, Blok Kodu veya Tip ile ara..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="h-8 pl-9 w-full bg-white transition-colors focus-visible:ring-1 focus-visible:ring-primary shadow-sm text-xs"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleExport} className="h-8 shadow-sm text-xs" title="Excel Olarak İndir">
                        <Download className="mr-2 h-3.5 w-3.5" /> Dışa Aktar
                    </Button>
                </div>
            </div>

            <div className="flex-auto overflow-auto relative bg-white">
                <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                            className="h-10 text-slate-600"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="cursor-pointer hover:bg-slate-50 transition-colors group"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2.5 border-b border-slate-100/50 px-2">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                                    Seçili koşullara uyan ünite bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-3 py-2 border-t bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center shrink-0">
                <span>Toplam {table.getFilteredRowModel().rows.length} ünite listeleniyor</span>
            </div>
        </div>
    );
}
