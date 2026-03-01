'use client';

import React, { useState, useMemo } from 'react';
import { Block } from '@/types/project.types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { BlockCreateModal } from './BlockCreateModal';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/useProjectStore';

interface BlockListProps {
    blocks: Block[];
    projectName: string;
}

const multiColumnFilterFn: FilterFn<Block> = (row, columnId, value, addMeta) => {
    const searchStr = value.toLowerCase();
    const name = (row.getValue('name') as string)?.toLowerCase() || '';
    const code = (row.getValue('code') as string)?.toLowerCase() || '';
    const parcel = (row.getValue('parcel_island') as string)?.toLowerCase() || '';

    return name.includes(searchStr) || code.includes(searchStr) || parcel.includes(searchStr);
};

export function BlockList({ blocks, projectName }: BlockListProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const { setBlocks, activeProject } = useProjectStore();

    const handleExport = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const rowsToExport = selectedRows.length > 0
            ? selectedRows.map(r => r.original)
            : table.getFilteredRowModel().rows.map(r => r.original);

        const exportData = rowsToExport.map(b => ({
            'Blok Kodu': b.code || '-',
            'Blok Adı': b.name,
            'Parsel / Ada': b.parcel_island || '-',
            'Ünite Sayısı': b.units_count || 0,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bloklar");
        XLSX.writeFile(wb, `${projectName}_Bloklar_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleDelete = async (blockId: number) => {
        if (!confirm("Bunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
        try {
            await api.delete(`/blocks/${blockId}`);
            setBlocks(blocks.filter(b => b.id !== blockId));
            toast.success("Silindi", { description: "Blok başarıyla silindi." });
        } catch (error: any) {
            toast.error("Hata", { description: error.response?.data?.message || "Silinirken bir hata oluştu." });
        }
    };

    const columns = useMemo<ColumnDef<Block>[]>(() => [
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
            accessorKey: 'code',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    BLOK KODU
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="font-semibold text-primary/80">{row.getValue('code') || '-'}</span>,
            size: 130,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    BLOK ADI
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="font-medium text-slate-800">{row.getValue('name')}</span>,
        },
        {
            accessorKey: 'parcel_island',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    PARSEL / ADA
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="text-slate-500 text-[13px]">{row.getValue('parcel_island') || '-'}</span>,
            size: 150,
        },
        {
            accessorKey: 'units_count',
            header: ({ column }) => (
                <div className="flex justify-center">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                        ÜNİTE SAYISI
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => <div className="text-center font-mono text-slate-600 font-medium">{row.original.units_count || 0}</div>,
            size: 140,
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const block = row.original;
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
                                <BlockCreateModal
                                    editBlock={block}
                                    trigger={
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                            <Edit2 className="mr-2 h-4 w-4" />
                                            <span>Düzenle</span>
                                        </DropdownMenuItem>
                                    }
                                />
                                <DropdownMenuItem onClick={() => handleDelete(block.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Sil</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
            size: 50,
        }
    ], [blocks, setBlocks]);

    const table = useReactTable({
        data: blocks,
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
                <div className="relative group w-72">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Bloklarda ara..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="h-8 pl-9 w-full bg-white transition-colors focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
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
                                        <TableCell key={cell.id} className="py-2.5 border-b border-slate-100/50">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                                    Seçili projeye ait hiç blok tanımlanmamış.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-3 py-2 border-t bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center shrink-0">
                <span>Toplam {table.getFilteredRowModel().rows.length} blok listeleniyor</span>
            </div>
        </div>
    );
}
