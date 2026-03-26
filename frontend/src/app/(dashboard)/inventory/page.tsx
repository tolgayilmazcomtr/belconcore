'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowDownUp,
  Warehouse,
  X,
  ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WarehouseT {
  id: number;
  name: string;
  location?: string;
  description?: string;
  is_active: boolean;
}

interface StockItem {
  id: number;
  name: string;
  code?: string;
  category?: string;
  unit: string;
  min_quantity: number;
  unit_price?: number;
  description?: string;
  current_stock?: number;
  total_in?: number;
  total_out?: number;
  is_low_stock?: boolean;
}

interface StockMovement {
  id: number;
  stock_item_id: number;
  warehouse_id?: number;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  unit_price?: number;
  total_price?: number;
  date: string;
  reference_no?: string;
  supplier?: string;
  description?: string;
  stock_item?: StockItem;
  warehouse?: WarehouseT;
}

interface Summary {
  item_count: number;
  low_stock_count: number;
  total_stock_value: number;
  month_in_value: number;
  month_out_value: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtQty = (n: number) =>
  n.toLocaleString('tr-TR', { maximumFractionDigits: 3 });

const todayStr = () => new Date().toISOString().split('T')[0];

const UNIT_OPTIONS = ['adet', 'kg', 'ton', 'm2', 'm3', 'lt', 'm', 'çuval'];

const TYPE_LABELS: Record<string, string> = {
  in: 'Giriş',
  out: 'Çıkış',
  transfer: 'Transfer',
  adjustment: 'Düzeltme',
};

const TYPE_BADGE_CLS: Record<string, string> = {
  in: 'bg-green-50 text-green-700 border-green-200',
  out: 'bg-red-50 text-red-700 border-red-200',
  transfer: 'bg-blue-50 text-blue-700 border-blue-200',
  adjustment: 'bg-amber-50 text-amber-700 border-amber-200',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  valueClass,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <p className={`text-xl font-bold font-mono ${valueClass || 'text-slate-800'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Modal({
  onClose,
  children,
  width = 'max-w-lg',
}: {
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-sm shadow-xl w-full ${width} mx-4 max-h-[90vh] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── ItemFormModal ─────────────────────────────────────────────────────────────

interface ItemFormModalProps {
  item?: StockItem | null;
  categories: string[];
  projectId: number;
  onClose: () => void;
  onSaved: () => void;
}

function ItemFormModal({ item, categories, projectId, onClose, onSaved }: ItemFormModalProps) {
  const [form, setForm] = useState({
    name: item?.name || '',
    code: item?.code || '',
    category: item?.category || '',
    unit: item?.unit || 'adet',
    min_quantity: item?.min_quantity ?? 0,
    unit_price: item?.unit_price != null ? String(item.unit_price) : '',
    description: item?.description || '',
  });
  const [saving, setSaving] = useState(false);

  const setField = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Kalem adı zorunludur');
    setSaving(true);
    try {
      const payload = {
        ...form,
        min_quantity: Number(form.min_quantity),
        unit_price: form.unit_price === '' ? null : Number(form.unit_price),
        active_project_id: projectId,
      };
      if (item) {
        await api.put(`/stock/items/${item.id}`, payload);
        toast.success('Kalem güncellendi');
      } else {
        await api.post('/stock/items', payload);
        toast.success('Kalem eklendi');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-800">
          {item ? 'Kalemi Düzenle' : 'Yeni Stok Kalemi'}
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Kalem Adı <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Kod</label>
            <input
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={form.code}
              onChange={(e) => setField('code', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Kategori</label>
            <input
              list="cat-list"
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
            />
            <datalist id="cat-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Birim</label>
            <select
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              value={form.unit}
              onChange={(e) => setField('unit', e.target.value)}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Min. Stok</label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={form.min_quantity}
              onChange={(e) => setField('min_quantity', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Birim Fiyat (₺)</label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={form.unit_price}
              onChange={(e) => setField('unit_price', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Açıklama</label>
          <textarea
            rows={2}
            className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-sm text-slate-600 hover:bg-slate-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── MovementModal ─────────────────────────────────────────────────────────────

interface MovementModalProps {
  preselectedItemId?: number | null;
  items: StockItem[];
  warehouses: WarehouseT[];
  projectId: number;
  onClose: () => void;
  onSaved: () => void;
}

const TYPE_BUTTON_STYLES: {
  key: 'in' | 'out' | 'transfer' | 'adjustment';
  label: string;
  idle: string;
  active: string;
}[] = [
  {
    key: 'in',
    label: 'Giriş',
    idle: 'border-slate-300 text-slate-600 hover:bg-green-50',
    active: 'border-green-500 bg-green-50 text-green-700',
  },
  {
    key: 'out',
    label: 'Çıkış',
    idle: 'border-slate-300 text-slate-600 hover:bg-red-50',
    active: 'border-red-500 bg-red-50 text-red-700',
  },
  {
    key: 'transfer',
    label: 'Transfer',
    idle: 'border-slate-300 text-slate-600 hover:bg-blue-50',
    active: 'border-blue-500 bg-blue-50 text-blue-700',
  },
  {
    key: 'adjustment',
    label: 'Düzeltme',
    idle: 'border-slate-300 text-slate-600 hover:bg-amber-50',
    active: 'border-amber-500 bg-amber-50 text-amber-700',
  },
];

function MovementModal({
  preselectedItemId,
  items,
  warehouses,
  projectId,
  onClose,
  onSaved,
}: MovementModalProps) {
  const [movType, setMovType] = useState<'in' | 'out' | 'transfer' | 'adjustment'>('in');
  const [stockItemId, setStockItemId] = useState<string>(
    preselectedItemId ? String(preselectedItemId) : ''
  );
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [date, setDate] = useState(todayStr());
  const [referenceNo, setReferenceNo] = useState('');
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const total =
    quantity && unitPrice ? Number(quantity) * Number(unitPrice) : null;

  const supplierLabel = movType === 'out' ? 'Kullanım Yeri' : 'Tedarikçi';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItemId) return toast.error('Stok kalemi seçiniz');
    if (!quantity || Number(quantity) <= 0) return toast.error('Geçerli miktar giriniz');
    if (!date) return toast.error('Tarih zorunludur');
    setSaving(true);
    try {
      await api.post('/stock/movements', {
        type: movType,
        stock_item_id: Number(stockItemId),
        warehouse_id: warehouseId === '' ? null : Number(warehouseId),
        quantity: Number(quantity),
        unit_price: unitPrice === '' ? null : Number(unitPrice),
        date,
        reference_no: referenceNo || null,
        supplier: supplier || null,
        description: description || null,
        active_project_id: projectId,
      });
      toast.success('Hareket eklendi');
      onSaved();
      onClose();
    } catch {
      toast.error('Kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-800">Stok Hareketi Ekle</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        {/* Type selector */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Hareket Tipi</label>
          <div className="grid grid-cols-4 gap-1.5">
            {TYPE_BUTTON_STYLES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setMovType(t.key)}
                className={`border rounded-sm py-1.5 text-xs font-medium transition-colors ${
                  movType === t.key ? t.active : t.idle
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Stok Kalemi <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
            value={stockItemId}
            onChange={(e) => setStockItemId(e.target.value)}
            required
          >
            <option value="">— Seçiniz —</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code ? `[${i.code}] ` : ''}
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Miktar <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.001"
              step="any"
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Birim Fiyat (₺)</label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {total !== null && (
          <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Toplam Tutar</span>
            <span className="text-sm font-semibold font-mono text-slate-800">
              {fmtCurrency(total)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Tarih <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Depo</label>
            <select
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">— Seçiniz —</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Referans No</label>
            <input
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {supplierLabel}
            </label>
            <input
              className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Açıklama</label>
          <textarea
            rows={2}
            className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-sm text-slate-600 hover:bg-slate-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── WarehouseFormModal ────────────────────────────────────────────────────────

interface WarehouseFormModalProps {
  warehouse?: WarehouseT | null;
  projectId: number;
  onClose: () => void;
  onSaved: () => void;
}

function WarehouseFormModal({ warehouse, projectId, onClose, onSaved }: WarehouseFormModalProps) {
  const [form, setForm] = useState({
    name: warehouse?.name || '',
    location: warehouse?.location || '',
    description: warehouse?.description || '',
    is_active: warehouse?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const setField = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Depo adı zorunludur');
    setSaving(true);
    try {
      const payload = { ...form, active_project_id: projectId };
      if (warehouse) {
        await api.put(`/stock/warehouses/${warehouse.id}`, payload);
        toast.success('Depo güncellendi');
      } else {
        await api.post('/stock/warehouses', payload);
        toast.success('Depo eklendi');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} width="max-w-md">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-800">
          {warehouse ? 'Depoyu Düzenle' : 'Yeni Depo'}
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Depo Adı <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Konum</label>
          <input
            className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            value={form.location}
            onChange={(e) => setField('location', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Açıklama</label>
          <textarea
            rows={2}
            className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setField('is_active', !form.is_active)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              form.is_active ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                form.is_active ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-slate-600">Aktif</span>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-sm text-slate-600 hover:bg-slate-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { activeProject } = useProjectStore();
  const projectId = activeProject?.id;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseT[]>([]);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  const [activeTab, setActiveTab] = useState<'items' | 'movements' | 'warehouses'>('items');

  // Item filters
  const [itemSearch, setItemSearch] = useState('');
  const [itemCategory, setItemCategory] = useState('');

  // Movement filters
  const [movFilterItem, setMovFilterItem] = useState('');
  const [movFilterWarehouse, setMovFilterWarehouse] = useState('');
  const [movFilterType, setMovFilterType] = useState('');
  const [movFilterDateFrom, setMovFilterDateFrom] = useState('');
  const [movFilterDateTo, setMovFilterDateTo] = useState('');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movPreselectedItem, setMovPreselectedItem] = useState<number | null>(null);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<WarehouseT | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    if (!projectId) return;
    setLoadingSummary(true);
    try {
      const res = await api.get('/stock/summary', {
        params: { active_project_id: projectId },
      });
      setSummary(res.data.data);
    } catch {
      // silent
    } finally {
      setLoadingSummary(false);
    }
  }, [projectId]);

  const fetchCategories = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api.get('/stock/categories', {
        params: { active_project_id: projectId },
      });
      setCategories(res.data.data || []);
    } catch {
      // silent
    }
  }, [projectId]);

  const fetchItems = useCallback(async () => {
    if (!projectId) return;
    setLoadingItems(true);
    try {
      const res = await api.get('/stock/items', {
        params: {
          active_project_id: projectId,
          ...(itemSearch ? { search: itemSearch } : {}),
          ...(itemCategory ? { category: itemCategory } : {}),
        },
      });
      setItems(res.data.data || []);
    } catch {
      toast.error('Stok kalemleri yüklenemedi');
    } finally {
      setLoadingItems(false);
    }
  }, [projectId, itemSearch, itemCategory]);

  const fetchMovements = useCallback(async () => {
    if (!projectId) return;
    setLoadingMovements(true);
    try {
      const res = await api.get('/stock/movements', {
        params: {
          active_project_id: projectId,
          ...(movFilterItem ? { stock_item_id: movFilterItem } : {}),
          ...(movFilterWarehouse ? { warehouse_id: movFilterWarehouse } : {}),
          ...(movFilterType ? { type: movFilterType } : {}),
          ...(movFilterDateFrom ? { date_from: movFilterDateFrom } : {}),
          ...(movFilterDateTo ? { date_to: movFilterDateTo } : {}),
        },
      });
      setMovements(res.data.data || []);
    } catch {
      toast.error('Hareketler yüklenemedi');
    } finally {
      setLoadingMovements(false);
    }
  }, [projectId, movFilterItem, movFilterWarehouse, movFilterType, movFilterDateFrom, movFilterDateTo]);

  const fetchWarehouses = useCallback(async () => {
    if (!projectId) return;
    setLoadingWarehouses(true);
    try {
      const res = await api.get('/stock/warehouses', {
        params: { active_project_id: projectId },
      });
      setWarehouses(res.data.data || []);
    } catch {
      toast.error('Depolar yüklenemedi');
    } finally {
      setLoadingWarehouses(false);
    }
  }, [projectId]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchSummary();
    fetchCategories();
    fetchWarehouses();
  }, [fetchSummary, fetchCategories, fetchWarehouses]);

  useEffect(() => {
    if (activeTab === 'items') fetchItems();
  }, [activeTab, fetchItems]);

  useEffect(() => {
    if (activeTab === 'movements') fetchMovements();
  }, [activeTab, fetchMovements]);

  useEffect(() => {
    if (activeTab === 'warehouses') fetchWarehouses();
  }, [activeTab, fetchWarehouses]);

  // Debounced search/category filter
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (activeTab === 'items') fetchItems();
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemSearch, itemCategory]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDeleteItem = async (item: StockItem) => {
    if (!confirm(`"${item.name}" kalemini silmek istediğinizden emin misiniz?`)) return;
    try {
      await api.delete(`/stock/items/${item.id}`);
      toast.success('Kalem silindi');
      fetchItems();
      fetchSummary();
    } catch {
      toast.error('Silinemedi');
    }
  };

  const handleDeleteMovement = async (mov: StockMovement) => {
    if (!confirm('Bu hareketi silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/stock/movements/${mov.id}`);
      toast.success('Hareket silindi');
      fetchMovements();
      fetchSummary();
    } catch {
      toast.error('Silinemedi');
    }
  };

  const handleDeleteWarehouse = async (w: WarehouseT) => {
    if (!confirm(`"${w.name}" deposunu silmek istediğinizden emin misiniz?`)) return;
    try {
      await api.delete(`/stock/warehouses/${w.id}`);
      toast.success('Depo silindi');
      fetchWarehouses();
    } catch {
      toast.error('Silinemedi');
    }
  };

  const openMovementModal = (preItemId?: number) => {
    setMovPreselectedItem(preItemId ?? null);
    setShowMovementModal(true);
  };

  // ── No project guard ───────────────────────────────────────────────────────

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center space-y-3">
          <Package className="mx-auto text-slate-300" size={40} />
          <p className="text-slate-500 text-sm">Stok yönetimi için lütfen bir proje seçin.</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 space-y-4 max-w-[1600px] mx-auto w-full">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-800">Stok & Depo Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-0.5">{activeProject.name}</p>
        </div>
        <button
          onClick={() => openMovementModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-sm hover:bg-blue-700"
        >
          <ArrowDownUp size={14} />
          Hareket Ekle
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Stok Kalemi"
          value={loadingSummary ? '—' : String(summary?.item_count ?? 0)}
          icon={<Package size={15} />}
        />
        <KpiCard
          label="Düşük Stok"
          value={loadingSummary ? '—' : String(summary?.low_stock_count ?? 0)}
          valueClass={(summary?.low_stock_count ?? 0) > 0 ? 'text-red-600' : 'text-slate-800'}
          icon={<AlertTriangle size={15} />}
          sub={(summary?.low_stock_count ?? 0) > 0 ? 'Müdahale gerekiyor' : undefined}
        />
        <KpiCard
          label="Stok Değeri"
          value={loadingSummary ? '—' : fmtCurrency(summary?.total_stock_value ?? 0)}
          icon={<Package size={15} />}
        />
        <KpiCard
          label="Bu Ay Giriş / Çıkış"
          value={
            loadingSummary
              ? '—'
              : `${fmtCurrency(summary?.month_in_value ?? 0)} / ${fmtCurrency(summary?.month_out_value ?? 0)}`
          }
          icon={
            <span className="flex gap-0.5">
              <TrendingUp size={13} className="text-green-500" />
              <TrendingDown size={13} className="text-red-400" />
            </span>
          }
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-0 -mb-px">
          {(
            [
              { key: 'items', label: 'Stok Kalemleri' },
              { key: 'movements', label: 'Hareketler' },
              { key: 'warehouses', label: 'Depolar' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Stok Kalemleri ────────────────────────────────────────────── */}
      {activeTab === 'items' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="w-full border border-slate-300 rounded-sm pl-7 pr-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Kalem ara…"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="border border-slate-300 rounded-sm pl-2.5 pr-7 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white appearance-none"
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
            <div className="ml-auto">
              <button
                onClick={() => {
                  setEditItem(null);
                  setShowItemModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-sm hover:bg-blue-700"
              >
                <Plus size={13} />
                Yeni Kalem
              </button>
            </div>
          </div>

          {(summary?.low_stock_count ?? 0) > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <span className="text-xs text-red-700">
                <strong>{summary!.low_stock_count}</strong> kalem düşük stok seviyesinde
              </span>
            </div>
          )}

          <div className="border border-slate-200 rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    'Kod',
                    'Kalem Adı',
                    'Kategori',
                    'Birim',
                    'Mevcut Stok',
                    'Min. Stok',
                    'Birim Fiyat',
                    'Durum',
                    'İşlemler',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingItems ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-xs text-slate-400">
                      Yükleniyor…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-xs text-slate-400">
                      Kayıt bulunamadı
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const stockQty = item.current_stock ?? 0;
                    const isLow = item.is_low_stock;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs text-slate-500 font-mono whitespace-nowrap">
                          {item.code || '—'}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-slate-800 whitespace-nowrap">
                          {item.name}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                          {item.category ? (
                            <span className="border border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-sm text-[11px]">
                              {item.category}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">{item.unit}</td>
                        <td
                          className={`px-3 py-2 text-xs font-mono font-medium ${
                            isLow ? 'text-red-600' : 'text-slate-700'
                          }`}
                        >
                          {fmtQty(stockQty)}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-slate-600">
                          {fmtQty(item.min_quantity)}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-slate-600">
                          {item.unit_price != null ? fmtCurrency(item.unit_price) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {item.min_quantity === 0 ? (
                            <span className="border border-slate-200 bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-sm text-[11px]">
                              —
                            </span>
                          ) : isLow ? (
                            <span className="border border-red-200 bg-red-50 text-red-700 px-1.5 py-0.5 rounded-sm text-[11px]">
                              Düşük Stok
                            </span>
                          ) : (
                            <span className="border border-green-200 bg-green-50 text-green-700 px-1.5 py-0.5 rounded-sm text-[11px]">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              title="Hareket Ekle"
                              onClick={() => openMovementModal(item.id)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm"
                            >
                              <ArrowDownUp size={13} />
                            </button>
                            <button
                              title="Düzenle"
                              onClick={() => {
                                setEditItem(item);
                                setShowItemModal(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              title="Sil"
                              onClick={() => handleDeleteItem(item)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Hareketler ───────────────────────────────────────────────── */}
      {activeTab === 'movements' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                className="border border-slate-300 rounded-sm pl-2.5 pr-7 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white appearance-none"
                value={movFilterItem}
                onChange={(e) => setMovFilterItem(e.target.value)}
              >
                <option value="">Tüm Kalemler</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
            <div className="relative">
              <select
                className="border border-slate-300 rounded-sm pl-2.5 pr-7 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white appearance-none"
                value={movFilterWarehouse}
                onChange={(e) => setMovFilterWarehouse(e.target.value)}
              >
                <option value="">Tüm Depolar</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
            <div className="relative">
              <select
                className="border border-slate-300 rounded-sm pl-2.5 pr-7 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white appearance-none"
                value={movFilterType}
                onChange={(e) => setMovFilterType(e.target.value)}
              >
                <option value="">Tüm Tipler</option>
                <option value="in">Giriş</option>
                <option value="out">Çıkış</option>
                <option value="transfer">Transfer</option>
                <option value="adjustment">Düzeltme</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
            <input
              type="date"
              className="border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={movFilterDateFrom}
              onChange={(e) => setMovFilterDateFrom(e.target.value)}
              title="Başlangıç tarihi"
            />
            <input
              type="date"
              className="border border-slate-300 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              value={movFilterDateTo}
              onChange={(e) => setMovFilterDateTo(e.target.value)}
              title="Bitiş tarihi"
            />
            <div className="ml-auto">
              <button
                onClick={() => openMovementModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-sm hover:bg-blue-700"
              >
                <Plus size={13} />
                Hareket Ekle
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    'Tarih',
                    'Kalem',
                    'Depo',
                    'Tip',
                    'Miktar',
                    'Birim Fiyat',
                    'Toplam',
                    'Referans No',
                    'Tedarikçi / Açıklama',
                    'İşlemler',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingMovements ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-xs text-slate-400">
                      Yükleniyor…
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-xs text-slate-400">
                      Kayıt bulunamadı
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => {
                    const isPositive = mov.type === 'in' || mov.type === 'adjustment';
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                          {mov.date}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-slate-800 whitespace-nowrap max-w-[160px] truncate">
                          {mov.stock_item?.name ?? `#${mov.stock_item_id}`}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                          {mov.warehouse?.name ?? '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`border px-1.5 py-0.5 rounded-sm text-[11px] font-medium ${TYPE_BADGE_CLS[mov.type]}`}
                          >
                            {TYPE_LABELS[mov.type]}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-2 text-xs font-mono font-medium whitespace-nowrap ${
                            isPositive ? 'text-green-700' : 'text-red-600'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {fmtQty(mov.quantity)}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-slate-600 whitespace-nowrap">
                          {mov.unit_price != null ? fmtCurrency(mov.unit_price) : '—'}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-slate-700 whitespace-nowrap">
                          {mov.total_price != null ? fmtCurrency(mov.total_price) : '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                          {mov.reference_no || '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500 max-w-[180px] truncate">
                          {mov.supplier || mov.description || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            title="Sil"
                            onClick={() => handleDeleteMovement(mov)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Depolar ──────────────────────────────────────────────────── */}
      {activeTab === 'warehouses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setEditWarehouse(null);
                setShowWarehouseModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-sm hover:bg-blue-700"
            >
              <Plus size={13} />
              Yeni Depo
            </button>
          </div>

          {loadingWarehouses ? (
            <p className="text-xs text-slate-400 py-4 text-center">Yükleniyor…</p>
          ) : warehouses.length === 0 ? (
            <div className="border border-slate-200 rounded-sm p-8 text-center">
              <Warehouse size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">Henüz depo eklenmedi</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {warehouses.map((w) => (
                <div key={w.id} className="bg-white border border-slate-200 rounded-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Warehouse size={15} className="text-slate-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-800">{w.name}</span>
                    </div>
                    <span
                      className={`border px-1.5 py-0.5 rounded-sm text-[11px] font-medium ${
                        w.is_active
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {w.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  {w.location && (
                    <p className="text-xs text-slate-500 mb-1">{w.location}</p>
                  )}
                  {w.description && (
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{w.description}</p>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => {
                        setEditWarehouse(w);
                        setShowWarehouseModal(true);
                      }}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-sm hover:bg-slate-100"
                    >
                      <Edit2 size={12} />
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDeleteWarehouse(w)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 px-2 py-1 rounded-sm hover:bg-red-50"
                    >
                      <Trash2 size={12} />
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {showItemModal && (
        <ItemFormModal
          item={editItem}
          categories={categories}
          projectId={projectId!}
          onClose={() => {
            setShowItemModal(false);
            setEditItem(null);
          }}
          onSaved={() => {
            fetchItems();
            fetchSummary();
            fetchCategories();
          }}
        />
      )}

      {showMovementModal && (
        <MovementModal
          preselectedItemId={movPreselectedItem}
          items={items}
          warehouses={warehouses}
          projectId={projectId!}
          onClose={() => {
            setShowMovementModal(false);
            setMovPreselectedItem(null);
          }}
          onSaved={() => {
            fetchMovements();
            fetchSummary();
            fetchItems();
          }}
        />
      )}

      {showWarehouseModal && (
        <WarehouseFormModal
          warehouse={editWarehouse}
          projectId={projectId!}
          onClose={() => {
            setShowWarehouseModal(false);
            setEditWarehouse(null);
          }}
          onSaved={fetchWarehouses}
        />
      )}
    </div>
  );
}
