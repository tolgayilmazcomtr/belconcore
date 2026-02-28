'use client';

import React from 'react';
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

interface ProjectListProps {
    projects: Project[];
    onRowClick: (project: Project) => void;
}

export function ProjectList({ projects, onRowClick }: ProjectListProps) {

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

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-[100px]">Kod</TableHead>
                        <TableHead>Proje Adı</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">Bütçe</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Proje bulunamadı.
                            </TableCell>
                        </TableRow>
                    ) : (
                        projects.map((project) => (
                            <TableRow
                                key={project.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => onRowClick(project)}
                            >
                                <TableCell className="font-medium">{project.code}</TableCell>
                                <TableCell>{project.name}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(project.status) as "default" | "secondary" | "outline"}>
                                        {getStatusLabel(project.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {project.planned_budget ?
                                        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.planned_budget)
                                        : '-'}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
