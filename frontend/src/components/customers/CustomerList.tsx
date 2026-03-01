'use client';

import React, { useState, useMemo } from 'react';
import { Customer } from '@/types/project.types';
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
import { Download, ChevronsUpDown, Search, MoreHorizontal, Edit2, Trash2, Building2, User2 } from 'lucide-react';
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
import { CustomerCreateModal } from './CustomerCreateModal';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useCrmStore } from '@/store/useCrmStore';

interface CustomerListProps {
    customers: Customer[];
    projectName?: string;
    onRowClick?: (customer: Customer) => void;
}

const multiColumnFilterFn: FilterFn<Customer> = (row, columnId, value, addMeta) => {
    const searchStr = value.toLowerCase();
    const firstName = (row.getValue('first_name') as string)?.toLowerCase() || '';
    const lastName = (row.getValue('last_name') as string)?.toLowerCase() || '';
    const company = (row.getValue('company_name') as string)?.toLowerCase() || '';
    const email = (row.getValue('email') as string)?.toLowerCase() || '';
    const phone = (row.getValue('phone') as string)?.toLowerCase() || '';

    return firstName.includes(searchStr) ||
        lastName.includes(searchStr) ||
        company.includes(searchStr) ||
        email.includes(searchStr) ||
        phone.includes(searchStr);
};

export function CustomerList({ customers, projectName, onRowClick }: CustomerListProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const { setCustomers } = useCrmStore();

    const handleExport = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const rowsToExport = selectedRows.length > 0
            ? selectedRows.map(r => r.original)
            : table.getFilteredRowModel().rows.map(r => r.original);

        const exportData = rowsToExport.map(c => ({
            'Tip': c.type === 'corporate' ? 'Kurumsal' : 'Bireysel',
            'Müşteri Adı': c.type === 'corporate' ? c.company_name : `${c.first_name} ${c.last_name}`,
            'Email': c.email || '-',
            'Telefon': c.phone || '-',
            'Fırsat Sayısı': c.leads_count || 0,
            'Şehir': c.city || '-',
            'Vergi Dairesi': c.tax_office || '-',
            'Vergi No': c.tax_number || '-',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Müşteriler");
        XLSX.writeFile(wb, `${projectName || 'Belcon'}_Müşteriler_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleDelete = async (customerId: number) => {
        if (!confirm("Bunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
        try {
            await api.delete(`/customers/${customerId}`);
            setCustomers(customers.filter(c => c.id !== customerId));
            toast.success("Silindi", { description: "Müşteri listesinden kaldırıldı." });
        } catch (error: any) {
            toast.error("Hata", { description: error.response?.data?.message || "Silinirken bir hata oluştu." });
        }
    };

    const columns = useMemo<ColumnDef<Customer>[]>(() => [
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
            accessorKey: 'type',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    TİP
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const type = row.getValue('type');
                return type === 'corporate'
                    ? <div className="flex flex-col items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded-md shadow-sm w-9 h-9" title="Kurumsal"><Building2 className="w-5 h-5" /></div>
                    : <div className="flex flex-col items-center justify-center p-1.5 bg-emerald-50 text-emerald-600 rounded-md shadow-sm w-9 h-9" title="Bireysel"><User2 className="w-5 h-5" /></div>
            },
            size: 60,
        },
        {
            id: 'name',
            accessorFn: (row) => row.type === 'corporate' ? row.company_name : `${row.first_name} ${row.last_name}`,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    MÜŞTERİ / FİRMA ADI
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="font-semibold text-slate-800">{row.getValue('name')}</span>,
            size: 200,
        },
        {
            accessorKey: 'phone',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    TELEFON
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="text-slate-600">{row.getValue('phone') || '-'}</span>,
            size: 130,
        },
        {
            accessorKey: 'email',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    E-POSTA
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="text-slate-600 text-sm">{row.getValue('email') || '-'}</span>,
        },
        {
            accessorKey: 'leads_count',
            header: ({ column }) => (
                <div className="flex justify-center">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                        FIRSAT SAYISI
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => <div className="text-center font-mono text-slate-700 font-medium bg-slate-100 rounded-md p-1 px-3 w-max mx-auto">{row.getValue('leads_count') || 0}</div>,
            size: 130,
        },
        {
            accessorKey: 'city',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0 text-xs font-semibold hover:bg-transparent">
                    ŞEHİR
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="text-slate-500">{row.getValue('city') || '-'}</span>,
            size: 120,
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const customer = row.original;
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
                                <CustomerCreateModal
                                    editCustomer={customer}
                                    trigger={
                                        <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()} className="cursor-pointer">
                                            <Edit2 className="mr-2 h-4 w-4" />
                                            <span>Düzenle</span>
                                        </DropdownMenuItem>
                                    }
                                />
                                <DropdownMenuItem onClick={() => handleDelete(customer.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
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
    ], [customers, setCustomers]);

    const table = useReactTable({
        data: customers,
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
        <div className="flex flex-col h-full bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative group w-[360px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="İsim, firma, mail veya telefon ile ara..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="h-9 pl-9 w-full bg-white transition-colors focus-visible:ring-1 focus-visible:ring-primary shadow-sm text-sm"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleExport} className="h-9 shadow-sm text-sm font-medium" title="Excel Olarak İndir">
                        <Download className="mr-2 h-4 w-4 text-slate-500" /> Dışa Aktar
                    </Button>
                </div>
            </div>

            <div className="flex-auto overflow-auto relative bg-white">
                <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                            className="h-11 text-slate-600 font-semibold"
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
                                    onClick={() => onRowClick && onRowClick(row.original)}
                                    className={`
                                        cursor-pointer transition-colors group
                                        ${row.getIsSelected() ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}
                                    `}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3 border-b border-slate-100 px-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500 bg-slate-50/30">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <User2 className="h-8 w-8 text-slate-300" />
                                        <p>Müşteri bulunamadı.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-3 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center shrink-0">
                <span>Toplam {table.getFilteredRowModel().rows.length} müşteri listeleniyor</span>
            </div>
        </div>
    );
}
