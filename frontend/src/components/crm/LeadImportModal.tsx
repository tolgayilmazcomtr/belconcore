'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/useProjectStore';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, ArrowRight, X } from 'lucide-react';

// ============================================================
// Başak CRM (kanban) export'unu Belcon CRM'e aktaran modal.
// Excel/CSV dosyası tarayıcıda parse edilir, aşamalar Belcon
// pipeline durumlarına eşlenir, POST /leads/import ile aktarılır.
// ============================================================

interface ImportRow {
    title: string;
    customer_name?: string;
    phone?: string;
    email?: string;
    status: string;
    stage_label?: string;
    expected_value?: number | null;
    source?: string;
    notes?: string;
    comments?: string;
    created_date?: string | null;
}

interface ImportSummary {
    leads_created: number;
    leads_skipped: number;
    customers_created: number;
    customers_matched: number;
}

const STATUS_LABELS: Record<string, string> = {
    new: 'Yeni',
    contacted: 'İletişimde',
    qualified: 'Nitelikli',
    proposal: 'Teklif',
    won: 'Kazanıldı',
    lost: 'Kaybedildi',
};

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-slate-100 text-slate-600 border-slate-200',
    contacted: 'bg-blue-100 text-blue-700 border-blue-200',
    qualified: 'bg-violet-100 text-violet-700 border-violet-200',
    proposal: 'bg-amber-100 text-amber-700 border-amber-200',
    won: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    lost: 'bg-red-100 text-red-600 border-red-200',
};

// Başak CRM kanban kolonu → Belcon pipeline durumu
function mapStage(stage: string): string {
    const u = stage.toLocaleUpperCase('tr');
    if (u.includes('KAYIP')) return 'lost';
    if (u.includes('SATIŞ') || u.includes('KAZAN')) return 'won';
    if (u.includes('TEKLİF')) return 'proposal';
    if (u.includes('GÖRMEYE') || u.includes('GÖRÜŞME') || u.includes('RANDEVU')) return 'qualified';
    if (u.includes('TAKİP') || u.includes('TAKIP')) return 'contacted';
    if (u.includes('ULAŞILAMADI') || u.includes('CEVAPSIZ')) return 'new';
    return 'new';
}

// Başlık eşleştirme için normalizasyon: küçük harf + harf/rakam dışını at
const normHeader = (h: string) => h.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g, '');

const HEADER_KEYS: Record<string, (h: string) => boolean> = {
    title: h => h === 'anlaşmaadı' || h === 'anlasmaadi',
    customer_name: h => h === 'müşteri' || h === 'musteri',
    phone: h => h.includes('telefon'),
    email: h => h.includes('eposta') || h.includes('email') || h.includes('mail'),
    stage: h => h.includes('aşama') || h.includes('kolon') || h.includes('asama'),
    amount: h => h === 'tutar',
    source: h => h === 'kaynak',
    created: h => h.includes('oluşturulma') || h.includes('olusturulma'),
    notes: h => h === 'notlar' || h === 'not',
    comments: h => h === 'yorumlar' || h === 'yorum',
};

function parseAmount(v: unknown): number | null {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (v == null) return null;
    let s = String(v).replace(/[^\d.,-]/g, '');
    if (!s) return null;
    if (s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.'); // 1.500.000,50 → 1500000.50
    } else if ((s.match(/\./g) || []).length > 1) {
        s = s.replace(/\./g, ''); // 1.500.000 → 1500000
    }
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
}

function parseDate(v: unknown): string | null {
    if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
    if (v == null) return null;
    const m = String(v).match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/); // dd.mm.yyyy
    if (!m) return null;
    const [, d, mo, y] = m;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

interface LeadImportModalProps {
    onSuccess?: () => void;
}

export function LeadImportModal({ onSuccess }: LeadImportModalProps) {
    const { activeProject } = useProjectStore();
    const [isOpen, setIsOpen] = useState(false);
    const [fileName, setFileName] = useState('');
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [parseError, setParseError] = useState('');
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportSummary | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setFileName(''); setRows([]); setParseError(''); setResult(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleFile = async (file: File) => {
        reset();
        setFileName(file.name);
        try {
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { cellDates: true });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: true, defval: '' });
            if (raw.length === 0) { setParseError('Dosyada satır bulunamadı.'); return; }

            // Başlıkları eşle
            const headers = Object.keys(raw[0]);
            const colMap: Record<string, string> = {};
            headers.forEach(h => {
                const n = normHeader(h);
                Object.entries(HEADER_KEYS).forEach(([key, match]) => {
                    if (!colMap[key] && match(n)) colMap[key] = h;
                });
            });

            if (!colMap.title && !colMap.customer_name) {
                setParseError('Beklenen kolonlar bulunamadı ("Anlaşma Adı" veya "Müşteri"). Başak CRM export dosyasını yüklediğinizden emin olun.');
                return;
            }

            const str = (r: Record<string, unknown>, key: string) => {
                const col = colMap[key];
                if (!col) return '';
                const v = r[col];
                if (v == null) return '';
                if (v instanceof Date) return '';
                return String(v).trim();
            };

            const parsed: ImportRow[] = [];
            raw.forEach(r => {
                const title = str(r, 'title') || str(r, 'customer_name');
                if (!title) return; // tamamen boş satır
                const stage = str(r, 'stage');
                parsed.push({
                    title,
                    customer_name: str(r, 'customer_name') || title,
                    phone: str(r, 'phone') || undefined,
                    email: str(r, 'email') || undefined,
                    status: stage ? mapStage(stage) : 'new',
                    stage_label: stage || undefined,
                    expected_value: colMap.amount ? parseAmount(r[colMap.amount]) : null,
                    source: (str(r, 'source') ? `Başak CRM (${str(r, 'source')})` : 'Başak CRM'),
                    notes: str(r, 'notes') || undefined,
                    comments: str(r, 'comments') || undefined,
                    created_date: colMap.created ? parseDate(r[colMap.created]) : null,
                });
            });

            if (parsed.length === 0) { setParseError('Aktarılabilecek dolu satır bulunamadı.'); return; }
            setRows(parsed);
        } catch (e) {
            console.error(e);
            setParseError('Dosya okunamadı. Geçerli bir Excel (.xlsx) veya CSV dosyası yükleyin.');
        }
    };

    const stageCounts = rows.reduce<Record<string, { label: string; status: string; count: number }>>((acc, r) => {
        const key = r.stage_label || '(aşamasız)';
        if (!acc[key]) acc[key] = { label: key, status: r.status, count: 0 };
        acc[key].count++;
        return acc;
    }, {});

    const handleImport = async () => {
        if (!activeProject || rows.length === 0) return;
        setImporting(true);
        try {
            const res = await api.post('/leads/import', {
                rows,
                active_project_id: activeProject.id,
            });
            setResult(res.data.summary as ImportSummary);
            toast.success(res.data.message || 'Aktarım tamamlandı.');
            onSuccess?.();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'Aktarım başarısız oldu.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={v => { setIsOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-9 font-medium gap-2">
                    <Upload className="h-4 w-4" /> İçe Aktar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
                <div className="bg-slate-50 border-b px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-primary" /> Başak CRM&apos;den İçe Aktar
                        </DialogTitle>
                        <DialogDescription>
                            Kanban export dosyasını (.xlsx / .csv) yükleyin; fırsatlar ve müşteriler bu projeye aktarılsın.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                    {result ? (
                        /* ── Sonuç ── */
                        <div className="flex flex-col items-center text-center gap-3 py-4">
                            <CheckCircle2 size={44} className="text-emerald-500" />
                            <p className="text-lg font-semibold text-slate-800">Aktarım Tamamlandı</p>
                            <div className="grid grid-cols-2 gap-2 w-full max-w-xs text-sm">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-emerald-700">{result.leads_created}</div>
                                    <div className="text-xs text-emerald-600">Fırsat aktarıldı</div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-blue-700">{result.customers_created}</div>
                                    <div className="text-xs text-blue-600">Yeni müşteri</div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-slate-700">{result.customers_matched}</div>
                                    <div className="text-xs text-slate-500">Mevcut müşteriyle eşleşti</div>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-amber-700">{result.leads_skipped}</div>
                                    <div className="text-xs text-amber-600">Zaten vardı (atlandı)</div>
                                </div>
                            </div>
                            <Button className="mt-2" onClick={() => setIsOpen(false)}>Kapat</Button>
                        </div>
                    ) : (
                        <>
                            {/* ── Dosya seçimi ── */}
                            <div>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                                />
                                {rows.length === 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="w-full border-2 border-dashed border-slate-300 rounded-xl py-10 flex flex-col items-center gap-2 text-slate-500 hover:border-primary/50 hover:text-primary transition-colors"
                                    >
                                        <Upload size={28} />
                                        <span className="text-sm font-medium">Excel / CSV dosyası seçin</span>
                                        <span className="text-xs text-slate-400">Anlaşma Adı, Müşteri, Telefon, Kolon/Aşama, Notlar, Yorumlar...</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                                        <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                            <FileSpreadsheet size={16} className="text-primary shrink-0" />
                                            <span className="truncate font-medium">{fileName}</span>
                                            <Badge variant="outline" className="shrink-0">{rows.length} satır</Badge>
                                        </div>
                                        <button className="text-slate-400 hover:text-red-500 p-1" onClick={reset}><X size={15} /></button>
                                    </div>
                                )}
                                {parseError && <p className="text-sm text-red-500 mt-2">{parseError}</p>}
                            </div>

                            {/* ── Aşama eşleme önizlemesi ── */}
                            {rows.length > 0 && (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Aşama Eşlemesi
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {Object.values(stageCounts).map(s => (
                                            <div key={s.label} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                                                <span className="flex-1 text-slate-700 truncate">{s.label}</span>
                                                <span className="text-xs text-slate-400">{s.count} kayıt</span>
                                                <ArrowRight size={13} className="text-slate-300" />
                                                <Badge variant="outline" className={`text-xs ${STATUS_COLORS[s.status]}`}>
                                                    {STATUS_LABELS[s.status]}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-slate-50 px-4 py-2 text-[11px] text-slate-400">
                                        Müşteriler telefon/e-posta ile eşleştirilir, yoksa oluşturulur. Not ve yorumlar fırsata aktivite olarak eklenir. Aynı fırsat ikinci kez aktarılmaz.
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!result && (
                    <div className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>İptal</Button>
                        <Button onClick={handleImport} disabled={rows.length === 0 || importing} className="min-w-[150px] gap-2">
                            {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                            {importing ? 'Aktarılıyor...' : `${rows.length > 0 ? rows.length + ' Kaydı ' : ''}Aktar`}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
