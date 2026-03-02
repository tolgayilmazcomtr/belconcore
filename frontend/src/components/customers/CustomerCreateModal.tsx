'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from '@/types/project.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import api from '@/lib/api';
import { toast } from 'sonner';
import { useCrmStore } from '@/store/useCrmStore';
import { useProjectStore } from '@/store/useProjectStore';
import { Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CustomerCreateModalProps {
    editCustomer?: Customer;
    trigger?: React.ReactNode;
}

export function CustomerCreateModal({ editCustomer, trigger }: CustomerCreateModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { activeProject } = useProjectStore();
    const { customers, setCustomers } = useCrmStore();

    const [formData, setFormData] = useState({
        type: 'individual' as 'individual' | 'corporate',
        first_name: '',
        last_name: '',
        company_name: '',
        email: '',
        phone: '',
        tax_office: '',
        tax_number: '',
        address: '',
        city: '',
        district: '',
        country: '',
    });

    useEffect(() => {
        if (editCustomer && isOpen) {
            setFormData({
                type: editCustomer.type || 'individual',
                first_name: editCustomer.first_name || '',
                last_name: editCustomer.last_name || '',
                company_name: editCustomer.company_name || '',
                email: editCustomer.email || '',
                phone: editCustomer.phone || '',
                tax_office: editCustomer.tax_office || '',
                tax_number: editCustomer.tax_number || '',
                address: editCustomer.address || '',
                city: editCustomer.city || '',
                district: editCustomer.district || '',
                country: editCustomer.country || '',
            });
        } else if (!isOpen) {
            setFormData({
                type: 'individual',
                first_name: '',
                last_name: '',
                company_name: '',
                email: '',
                phone: '',
                tax_office: '',
                tax_number: '',
                address: '',
                city: '',
                district: '',
                country: '',
            });
        }
    }, [editCustomer, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject) {
            toast.error('Aktif proje seçilmemiş.');
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                active_project_id: activeProject.id
            };

            if (editCustomer) {
                const response = await api.put(`/customers/${editCustomer.id}`, payload);
                setCustomers(customers.map(c => c.id === editCustomer.id ? response.data.data : c));
                toast.success('Müşteri başarıyla güncellendi.');
            } else {
                const response = await api.post('/customers', payload);
                setCustomers([...customers, response.data.data]);
                toast.success('Yeni müşteri başarıyla oluşturuldu.');
            }
            setIsOpen(false);
        } catch (error: any) {
            toast.error('İşlem başarısız', {
                description: error.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button className="h-9 font-medium shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Müşteri
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden gap-0">
                <div className="bg-slate-50 border-b px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-slate-800">
                            {editCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            Müşteri/Firma detaylarını doldurun.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Müşteri Tipi</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tip Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Bireysel</SelectItem>
                                        <SelectItem value="corporate">Kurumsal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.type === 'individual' ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">Ad</Label>
                                        <Input
                                            id="first_name"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            placeholder="Ahmet"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Soyad</Label>
                                        <Input
                                            id="last_name"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            placeholder="Yılmaz"
                                            required
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="company_name">Firma Adı</Label>
                                    <Input
                                        id="company_name"
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        placeholder="XYZ İnşaat A.Ş."
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="0532 000 00 00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="ornek@mail.com"
                                />
                            </div>
                        </div>

                        {formData.type === 'corporate' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tax_office">Vergi Dairesi</Label>
                                    <Input
                                        id="tax_office"
                                        value={formData.tax_office}
                                        onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                                        placeholder="Zincirlikuyu V.D."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax_number">Vergi Numarası</Label>
                                    <Input
                                        id="tax_number"
                                        value={formData.tax_number}
                                        onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                                        placeholder="1234567890"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="address">Açık Adres</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Mahalle, Cadde, Sokak..."
                                rows={2}
                                className="resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">Şehir</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="İstanbul"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="district">İlçe</Label>
                                <Input
                                    id="district"
                                    value={formData.district}
                                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                    placeholder="Beyşiktaş"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Ülke</Label>
                                <Input
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    placeholder="Türkiye"
                                    defaultValue="Türkiye"
                                />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsOpen(false)} type="button">
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="min-w-[120px]">
                        {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
