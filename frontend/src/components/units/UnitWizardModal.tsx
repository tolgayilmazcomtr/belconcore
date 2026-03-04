"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Block } from "@/types/project.types";
import { useProjectStore } from "@/store/useProjectStore";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    Wand2, ChevronRight, ChevronLeft, Plus, Trash2, Loader2,
    Building2, Layers, Compass, Eye, CheckCircle2
} from "lucide-react";

// ============================================================
// Types
// ============================================================
interface FloorDef {
    label: string;   // e.g. "Zemin", "1", "2", "-1"
    floor_no: string; // stored value e.g. "0", "1", "2"
    isBasement: boolean;
}

interface FaceDef {
    code: string;       // e.g. "CK"
    direction: string;  // e.g. "Göl + Kale (Batı)"
    unit_type: string;  // e.g. "3+1"
    compass: string;    // e.g. "Kuzey-Batı"
}

interface GeneratedUnit {
    unit_no: string;
    floor_no: string;
    unit_type: string;
    status: "available";
    block_id: number;
}

interface UnitWizardModalProps {
    block: Block;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

// ============================================================
// Helpers
// ============================================================
const COMPASS_DIRS = [
    { key: "K", label: "Kuzey", deg: 0 },
    { key: "KD", label: "Kuzey-Doğu", deg: 45 },
    { key: "D", label: "Doğu", deg: 90 },
    { key: "GD", label: "Güney-Doğu", deg: 135 },
    { key: "G", label: "Güney", deg: 180 },
    { key: "GB", label: "Güney-Batı", deg: 225 },
    { key: "B", label: "Batı", deg: 270 },
    { key: "KB", label: "Kuzey-Batı", deg: 315 },
];

function CompassPicker({ selected, onChange }: { selected: string; onChange: (key: string, label: string) => void }) {
    const size = 80;
    const center = size / 2;
    const r = 30;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Center dot */}
            <div className="absolute w-2 h-2 bg-slate-300 rounded-full" style={{ left: center - 4, top: center - 4 }} />
            {COMPASS_DIRS.map(d => {
                const rad = (d.deg - 90) * (Math.PI / 180);
                const x = center + r * Math.cos(rad);
                const y = center + r * Math.sin(rad);
                const isSelected = selected === d.key;
                return (
                    <button
                        key={d.key}
                        title={d.label}
                        onClick={() => onChange(d.key, d.label)}
                        className={`absolute flex items-center justify-center rounded-full text-[9px] font-bold border transition-all ${isSelected
                            ? "bg-primary border-primary text-white shadow-md scale-110"
                            : "bg-white border-slate-300 text-slate-500 hover:border-primary hover:text-primary"
                            }`}
                        style={{ width: 20, height: 20, left: x - 10, top: y - 10 }}
                    >
                        {d.key}
                    </button>
                );
            })}
        </div>
    );
}

function generateFloors(
    hasBasement: boolean,
    basementCount: number,
    hasGround: boolean,
    normalCount: number,
    hasRoof: boolean
): FloorDef[] {
    const floors: FloorDef[] = [];
    for (let i = basementCount; i >= 1; i--) {
        floors.push({ label: `-${i}. Bodrum`, floor_no: `-${i}`, isBasement: true });
    }
    if (hasGround) {
        floors.push({ label: "Zemin Kat", floor_no: "0", isBasement: false });
    }
    for (let i = 1; i <= normalCount; i++) {
        floors.push({ label: `${i}. Kat`, floor_no: `${i}`, isBasement: false });
    }
    if (hasRoof) {
        floors.push({ label: "Çatı / Teras Kat", floor_no: "roof", isBasement: false });
    }
    return floors;
}

function generateUnits(blockCode: string, floors: FloorDef[], faces: FaceDef[], blockId: number): GeneratedUnit[] {
    const result: GeneratedUnit[] = [];
    for (const floor of floors) {
        // Bodrum katlarda daire oluşturulmaz (otopark/depo)
        if (floor.isBasement) continue;
        for (const face of faces) {
            const floorTag = floor.floor_no === "0" ? "Z" : floor.floor_no;
            const unit_no = `${blockCode}${floorTag}${face.code}`;
            result.push({
                unit_no,
                floor_no: floor.label,
                unit_type: face.unit_type,
                status: "available",
                block_id: blockId,
            });
        }
    }
    return result;
}

// ============================================================
// Component
// ============================================================
export function UnitWizardModal({ block, trigger, onSuccess }: UnitWizardModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { activeProject, units, setUnits } = useProjectStore();

    // Step 1 State
    const [hasBasement, setHasBasement] = useState(false);
    const [basementCount, setBasementCount] = useState(1);
    const [hasGround, setHasGround] = useState(true);
    const [normalFloorCount, setNormalFloorCount] = useState(5);
    const [hasRoof, setHasRoof] = useState(false);

    // Step 2 State
    const [faces, setFaces] = useState<FaceDef[]>([
        { code: "CK", direction: "Çevre Yolu + Kale (Batı)", unit_type: "3+1", compass: "B" },
        { code: "CE", direction: "Çevre Yolu + Edremit (Güney)", unit_type: "2+1", compass: "G" },
        { code: "GK", direction: "Göl + Kale (Kuzey)", unit_type: "3+1", compass: "K" },
        { code: "GE", direction: "Göl + Edremit (Doğu)", unit_type: "2+1", compass: "D" },
    ]);

    const blockCode = block.code || block.name.charAt(0).toUpperCase();

    const floors = generateFloors(hasBasement, basementCount, hasGround, normalFloorCount, hasRoof);
    const generatedUnits = generateUnits(blockCode, floors, faces, block.id);

    // ---- Face handlers ----
    const addFace = () => {
        setFaces(prev => [...prev, { code: "", direction: "", unit_type: "3+1", compass: "" }]);
    };
    const removeFace = (i: number) => {
        setFaces(prev => prev.filter((_, idx) => idx !== i));
    };
    const updateFace = (i: number, field: keyof FaceDef, value: string) => {
        setFaces(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));
    };

    // ---- Submit ----
    const handleCreate = async () => {
        if (!activeProject) { toast.error("Proje seçili değil!"); return; }
        if (faces.some(f => !f.code.trim())) { toast.error("Tüm cephe kodlarını doldurun!"); return; }
        if (generatedUnits.length === 0) { toast.error("Oluşturulacak ünite bulunamadı!"); return; }

        setLoading(true);
        try {
            const payload = {
                units: generatedUnits.map(u => ({
                    block_id: u.block_id,
                    unit_no: u.unit_no,
                    floor_no: u.floor_no,
                    unit_type: u.unit_type,
                    status: u.status,
                })),
            };
            const res = await api.post("/units/bulk", payload, {
                params: { active_project_id: activeProject.id },
            });
            const created = res.data?.data || [];
            setUnits([...created, ...units]);
            toast.success("Üniteleri Oluşturuldu", {
                description: `${created.length} adet ünite "${block.name}" bloğuna eklendi.`,
            });
            setOpen(false);
            resetState();
            onSuccess?.();
        } catch (err: any) {
            toast.error("Hata", {
                description: err.response?.data?.message || "Toplu oluşturma sırasında hata oluştu.",
            });
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setStep(1);
        setHasBasement(false);
        setBasementCount(1);
        setHasGround(true);
        setNormalFloorCount(5);
        setHasRoof(false);
        setFaces([
            { code: "CK", direction: "Çevre Yolu + Kale (Batı)", unit_type: "3+1", compass: "B" },
            { code: "CE", direction: "Çevre Yolu + Edremit (Güney)", unit_type: "2+1", compass: "G" },
            { code: "GK", direction: "Göl + Kale (Kuzey)", unit_type: "3+1", compass: "K" },
            { code: "GE", direction: "Göl + Edremit (Doğu)", unit_type: "2+1", compass: "D" },
        ]);
    };

    // ---- Group by floor for preview ----
    const byFloor: Record<string, GeneratedUnit[]> = {};
    for (const u of generatedUnits) {
        if (!byFloor[u.floor_no]) byFloor[u.floor_no] = [];
        byFloor[u.floor_no].push(u);
    }

    // ============================================================
    // Render: Step Indicator
    // ============================================================
    const StepDot = ({ n, label }: { n: number; label: string }) => (
        <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${step === n ? "bg-primary border-primary text-white" : step > n ? "bg-green-500 border-green-500 text-white" : "bg-white border-slate-300 text-slate-400"}`}>
                {step > n ? <CheckCircle2 size={16} /> : n}
            </div>
            <span className={`text-[10px] font-medium tracking-wide ${step >= n ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
        </div>
    );

    // ============================================================
    // Render
    // ============================================================
    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
            <div onClick={() => setOpen(true)}>
                {trigger ?? (
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5">
                        <Wand2 size={13} /> Ünite Sihirbazı
                    </Button>
                )}
            </div>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Building2 size={20} className="text-primary" />
                        <span className="font-bold">{block.name}</span>
                        <span className="text-slate-400 font-normal">— Ünite Sihirbazı</span>
                    </DialogTitle>
                    {/* Step Indicator */}
                    <div className="flex items-center gap-0 mt-4">
                        <StepDot n={1} label="Kat Yapısı" />
                        <div className={`flex-1 h-0.5 mb-4 mx-1 ${step > 1 ? "bg-green-400" : "bg-slate-200"}`} />
                        <StepDot n={2} label="Cephe / Yön" />
                        <div className={`flex-1 h-0.5 mb-4 mx-1 ${step > 2 ? "bg-green-400" : "bg-slate-200"}`} />
                        <StepDot n={3} label="Önizleme" />
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5">

                    {/* ================================================ STEP 1 */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <p className="text-sm text-slate-500 flex items-center gap-2"><Layers size={14} /> Bloğun kat yapısını tanımlayın.</p>

                            {/* Basement */}
                            <div className="rounded-lg border p-4 space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={hasBasement} onChange={e => setHasBasement(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-primary" />
                                    <span className="font-medium text-sm">Bodrum kat var</span>
                                </label>
                                {hasBasement && (
                                    <div className="pl-7 flex items-center gap-3">
                                        <span className="text-sm text-slate-500 whitespace-nowrap">Bodrum kat sayısı:</span>
                                        <div className="flex items-center border rounded-md overflow-hidden">
                                            <button onClick={() => setBasementCount(Math.max(1, basementCount - 1))} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-sm font-bold">−</button>
                                            <span className="px-4 py-1.5 text-sm font-mono font-semibold">{basementCount}</span>
                                            <button onClick={() => setBasementCount(Math.min(5, basementCount + 1))} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-sm font-bold">+</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Ground */}
                            <div className="rounded-lg border p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={hasGround} onChange={e => setHasGround(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-primary" />
                                    <span className="font-medium text-sm">Zemin kat var (0. Kat)</span>
                                </label>
                            </div>

                            {/* Normal Floors */}
                            <div className="rounded-lg border p-4 space-y-3">
                                <span className="font-medium text-sm block">Normal kat sayısı</span>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border rounded-md overflow-hidden">
                                        <button onClick={() => setNormalFloorCount(Math.max(0, normalFloorCount - 1))} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-sm font-bold">−</button>
                                        <span className="px-5 py-2 text-lg font-mono font-bold text-primary">{normalFloorCount}</span>
                                        <button onClick={() => setNormalFloorCount(Math.min(50, normalFloorCount + 1))} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-sm font-bold">+</button>
                                    </div>
                                    <span className="text-sm text-slate-400">kat (1. kat → {normalFloorCount}. kat)</span>
                                </div>
                            </div>

                            {/* Roof */}
                            <div className="rounded-lg border p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={hasRoof} onChange={e => setHasRoof(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-primary" />
                                    <span className="font-medium text-sm">Çatı / Teras katı var</span>
                                </label>
                            </div>

                            {/* Summary */}
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
                                <span className="font-semibold text-primary">Toplam {floors.length} kat</span>
                                <span className="text-slate-500 ml-2">tanımlandı:</span>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {floors.map(f => (
                                        <span
                                            key={f.floor_no}
                                            className={`rounded px-2 py-0.5 text-[11px] font-mono border ${f.isBasement
                                                ? "bg-slate-100 border-slate-300 text-slate-400 line-through"
                                                : "bg-white border-slate-200 text-slate-600"
                                                }`}
                                        >
                                            {f.label}{f.isBasement ? " (otopark/depo)" : ""}
                                        </span>
                                    ))}
                                </div>
                                {floors.some(f => f.isBasement) && (
                                    <p className="text-xs text-amber-600 mt-2">⚠️ Bodrum katlarda otomatik daire oluşturulmaz.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ================================================ STEP 2 */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500 flex items-center gap-2"><Compass size={14} /> Her katta yer alacak dairelerin cephe/yön bilgilerini tanımlayın.</p>

                            {faces.map((face, i) => (
                                <div key={i} className="border rounded-lg p-4 space-y-3 relative group">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Daire #{i + 1}</span>
                                        {faces.length > 1 && (
                                            <button onClick={() => removeFace(i)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1 block">Kısa Kod *</label>
                                            <Input
                                                value={face.code}
                                                onChange={e => updateFace(i, "code", e.target.value.toUpperCase().replace(/\s/g, ""))}
                                                placeholder="Örn: CK"
                                                className="h-9 font-mono text-sm uppercase"
                                                maxLength={6}
                                            />
                                            <p className="text-[9px] text-slate-400 mt-0.5">3D görünümde kullanılır</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1 block">Cephe Açıklaması</label>
                                            <Input
                                                value={face.direction}
                                                onChange={e => updateFace(i, "direction", e.target.value)}
                                                placeholder="Örn: Deniz + Kuzey"
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1 block">Ünite Tipi</label>
                                            <select
                                                value={face.unit_type}
                                                onChange={e => updateFace(i, "unit_type", e.target.value)}
                                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                {["Stüdyo", "1+0", "1+1", "2+1", "3+1", "4+1", "4+2", "5+1", "Dubleks", "Penthouse", "Dükkan", "Ofis", "Depo"].map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {/* Unit no preview */}
                                    <div className="bg-slate-50 rounded px-3 py-2 text-[11px] text-slate-500">
                                        Örnek ünite no: <span className="font-mono font-bold text-primary">{blockCode}1{face.code || "??"}</span>
                                        {face.direction && <span className="ml-2 text-slate-400">— {face.direction}</span>}
                                    </div>
                                </div>
                            ))}

                            <Button variant="outline" size="sm" onClick={addFace} className="w-full gap-2 border-dashed text-slate-500 hover:text-primary hover:border-primary">
                                <Plus size={14} /> Yeni Cephe Ekle
                            </Button>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                                <strong>Toplam:</strong> {floors.filter(f => !f.isBasement).length} kat × {faces.length} cephe = <strong>{generatedUnits.length} ünite</strong> oluşturulacak
                                {floors.some(f => f.isBasement) && (
                                    <span className="ml-2 text-slate-500 text-xs">({floors.filter(f => f.isBasement).length} bodrum kat hariç)</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ================================================ STEP 3 */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Eye size={14} />
                                <span>Oluşturulacak <strong className="text-primary">{generatedUnits.length} ünite</strong> aşağıda listeleniyor. Onaylayarak kaydedin.</span>
                            </div>

                            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                {Object.entries(byFloor).map(([floorLabel, floorUnits]) => (
                                    <div key={floorLabel} className="border rounded-lg overflow-hidden">
                                        <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{floorLabel}</span>
                                            <span className="text-[10px] text-slate-400">{floorUnits.length} daire</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 p-3">
                                            {floorUnits.map(u => (
                                                <div key={u.unit_no} className="bg-white border border-slate-200 rounded px-3 py-1.5 text-center hover:border-primary hover:shadow-sm transition-all">
                                                    <div className="font-mono text-xs font-bold text-primary">{u.unit_no}</div>
                                                    <div className="text-[9px] text-slate-400 mt-0.5">{u.unit_type}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold text-green-800">Tüm üniteler "Satışa Açık" olarak oluşturulacak</p>
                                    <p className="text-green-700 text-xs mt-0.5">Durumları daha sonra Üniteler sayfasından veya 3D satış ekranından değiştirebilirsiniz.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-slate-50/50 flex items-center justify-between shrink-0">
                    <div className="text-xs text-slate-400">
                        Adım {step} / 3 — {block.name} Bloğu
                    </div>
                    <div className="flex gap-2">
                        {step > 1 && (
                            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1.5">
                                <ChevronLeft size={14} /> Geri
                            </Button>
                        )}
                        {step < 3 ? (
                            <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={floors.length === 0 || (step === 2 && faces.length === 0)} className="gap-1.5">
                                İleri <ChevronRight size={14} />
                            </Button>
                        ) : (
                            <Button size="sm" onClick={handleCreate} disabled={loading} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white min-w-[160px]">
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                {loading ? "Oluşturuluyor..." : `${generatedUnits.length} Ünite Oluştur`}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
