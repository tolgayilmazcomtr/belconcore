'use client';

import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectDetailPanel } from '@/components/projects/ProjectDetailPanel';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api/index';

import { Project } from '@/types/project.types';

export default function ProjectsPage() {
    const { projects, setProjects, setLoading } = useProjectStore();
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await api.get('/projects');
                // Handle paginated response or simple array
                const data = response.data?.data || response.data || [];
                setProjects(data);
            } catch (error) {
                console.error('Failed to fetch projects', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [setLoading, setProjects]);

    const handleCreateProject = () => {
        // Open empty panel for creation
        useProjectStore.getState().setActiveProject(null);
        setIsPanelOpen(true);
    };

    return (
        <div className="flex h-full flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projeler</h1>
                    <p className="text-muted-foreground">
                        Tüm projelerinizi, blok ve ünite detaylarını tek merkezden yönetin.
                    </p>
                </div>
                <Button onClick={handleCreateProject}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Proje
                </Button>
            </div>

            <div className="flex-1 rounded-lg border bg-background shadow-sm">
                <ProjectList
                    projects={projects}
                    onRowClick={(project: Project) => {
                        useProjectStore.getState().setActiveProject(project);
                        setIsPanelOpen(true);
                    }}
                />
            </div>

            <ProjectDetailPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
            />
        </div>
    );
}
