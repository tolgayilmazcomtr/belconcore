'use client';

import React, { useState, useMemo } from 'react';
import { Project } from '@/types/project.types';
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
    ColumnDef
} from '@tanstack/react-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectCreateModal } from './ProjectCreateModal';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/useProjectStore';

interface ProjectListProps {
    projects: Project[];
    onRowClick: (project: Project) => void;
}

export function ProjectList({ projects, onRowClick }: ProjectListProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const { setProjects } = useProjectStore();

    const handleExport = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const rowsToExport = selectedRows.length > 0
            ? selectedRows.map(r => r.original)
            : table.getFilteredRowModel().rows.map(r => r.original);

        const exportData = rowsToExport.map(p => ({
            'Kod': p.code || '-',
            'Proje Adı': p.name,
            'Durum': getStatusLabel(p.status),
            'Başlangıç': p.start_date || '-',
            'Bütçe': p.planned_budget ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(p.planned_budget) : '-',
            'Blok Sayısı': p.blocks_count || 0,
            'Ünite Sayısı': p.units_count || 0,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Projeler");
        XLSX.writeFile(wb, `Projeler_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleDelete = async (projectId: number) => {
        if (!confirm("Bunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
        try {
            await api.delete(`/projects/${projectId}`);
            setProjects(projects.filter(p => p.id !== projectId));
            toast.success("Silindi", { description: "Proje başarıyla silindi." });
        } catch (error: any) {
            toast.error("Hata", { description: error.response?.data?.message || "Silinirken bir hata oluştu." });
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'planned': return 'secondary';
            case 'completed': return 'outline';
            default: return 'secondary';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Devam Ediyor';
            case 'planned': return 'Planlandı';
            case 'completed': return 'Tamamlandı';
            default: return status;
        }
    };

    const columns = useMemo<ColumnDef<Project>[]>(() => [
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
            header: ({ column }) => {
                return (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                        Kod
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <span className="font-semibold text-primary/80">{row.getValue('code') || '-'}</span>,
            size: 100,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => {
                return (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                        Proje Adı
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <span className="font-medium text-slate-800">{row.getValue('name')}</span>,
        },
        {
            accessorKey: 'blocks_count',
            header: () => <span className="text-xs font-semibold">Bloklar</span>,
            cell: ({ row }) => <span className="text-slate-600">{row.original.blocks_count || 0} Blok</span>,
            size: 120,
        },
        {
            accessorKey: 'units_count',
            header: () => <span className="text-xs font-semibold">Üniteler</span>,
            cell: ({ row }) => <span className="text-slate-600">{row.original.units_count || 0} Ünite</span>,
            size: 120,
        },
        {
            accessorKey: 'status',
            header: () => <span className="text-xs font-semibold">Durum</span>,
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return (
                    <Badge variant={getStatusVariant(status) as "default" | "secondary" | "outline"} className="shadow-sm">
                        {getStatusLabel(status)}
                    </Badge>
                )
            },
            size: 130,
        },
        {
            accessorKey: 'planned_budget',
            header: ({ column }) => {
                return (
                    <div className="flex justify-end pr-2">
                        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                            Planlanan Bütçe
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )
            },
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("planned_budget"));
                const formatted = isNaN(amount) ? '-' : new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                }).format(amount);
                return <div className="text-right font-medium pr-2 text-slate-700">{formatted}</div>
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const project = row.original;
                return (
                    <div className="flex justify-end pr-3" onClick={(e) => e.stopPropagation()}>
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
                                <ProjectCreateModal
                                    editProject={project}
                                    trigger={
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                            <Edit2 className="mr-2 h-4 w-4" />
                                            <span>Düzenle</span>
                                        </DropdownMenuItem>
                                    }
                                />
                                <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
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
    ], [projects, setProjects]);

    const table = useReactTable({
        data: projects,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
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
        <div className="flex flex-col h-full bg-white rounded-md">
            {/* Odoo Style Toolbar Setup in Component */}
            <div className="flex items-center justify-between p-3 border-b bg-slate-50/50">
                <div className="relative group w-72">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Projelerde ara..."
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

            <div className="flex-auto overflow-auto relative">
                <Table>
                    <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} style={{ width: header.getSize() }} className="h-10 text-slate-600">
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
                                    onClick={() => onRowClick(row.original)}
                                    className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2.5 border-b border-slate-100 group-hover:border-blue-100">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                                    Sonuç bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-3 py-2 border-t bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center shrink-0">
                <span>Toplam {table.getFilteredRowModel().rows.length} proje listeleniyor</span>
            </div>
        </div>
    );
}
