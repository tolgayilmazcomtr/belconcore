// Block type definitions, default configs, and preview renderers
// This is the shared config used by the editor and the preview

export type BlockType =
    | 'LogoBlock'
    | 'CompanyInfoBlock'
    | 'ClientInfoBlock'
    | 'OfferMetaBlock'
    | 'UnitInfoBlock'
    | 'PricingTableBlock'
    | 'PaymentPlanBlock'
    | 'NotesBlock'
    | 'SignatureBlock'
    | 'DividerBlock'
    | 'TextBlock'
    | 'FooterBlock'
    | 'InfoGridBlock'
    | 'ValidityBlock';

export interface TemplateBlock {
    id: string;
    type: BlockType;
    settings: Record<string, unknown>;
}

// ─── Page Size ───────────────────────────────────────────────────────

export type PageSize = 'A4' | 'A5' | 'A3' | 'Letter' | 'Legal';
export type PageOrientation = 'portrait' | 'landscape';

/** Physical dimensions in mm */
export const PAGE_DIMENSIONS_MM: Record<PageSize, { width: number; height: number }> = {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    A3: { width: 297, height: 420 },
    Letter: { width: 215.9, height: 279.4 },
    Legal: { width: 215.9, height: 355.6 },
};

export const MM_TO_PX = 96 / 25.4; // 3.7795...

export function getPagePx(size: PageSize, orientation: PageOrientation) {
    const { width, height } = PAGE_DIMENSIONS_MM[size];
    const wMm = orientation === 'landscape' ? height : width;
    const hMm = orientation === 'landscape' ? width : height;
    return { width: Math.round(wMm * MM_TO_PX), height: Math.round(hMm * MM_TO_PX) };
}

export interface PageSettings {
    page_size: PageSize;
    orientation: PageOrientation;
    margin_top: number;    // mm
    margin_bottom: number; // mm
    margin_left: number;   // mm
    margin_right: number;  // mm
    font_size: number;     // pt
}

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
    page_size: 'A4',
    orientation: 'portrait',
    margin_top: 14,
    margin_bottom: 18,
    margin_left: 16,
    margin_right: 16,
    font_size: 9,
};

export interface TemplateConfig {
    id?: number | null;
    type: 'offer' | 'invoice';
    name: string;
    project_id?: number | null;
    blocks: TemplateBlock[];
    page_settings: PageSettings;
}

// ─── Block Catalogue ─────────────────────────────────────────────────
export interface BlockCatalogueItem {
    type: BlockType;
    label: string;
    description: string;
    category: 'header' | 'info' | 'pricing' | 'footer' | 'decoration';
    defaultSettings: Record<string, unknown>;
    settingsSchema: SettingField[];
}

export interface SettingField {
    key: string;
    label: string;
    type: 'text' | 'select' | 'number' | 'color' | 'boolean';
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
}

export const BLOCK_CATALOGUE: BlockCatalogueItem[] = [
    {
        type: 'LogoBlock',
        label: 'Logo',
        description: 'Proje logosu',
        category: 'header',
        defaultSettings: { align: 'left', max_height: 48 },
        settingsSchema: [
            { key: 'align', label: 'Hizalama', type: 'select', options: [{ value: 'left', label: 'Sol' }, { value: 'center', label: 'Orta' }, { value: 'right', label: 'Sağ' }] },
            { key: 'max_height', label: 'Maksimum Yükseklik (px)', type: 'number', min: 24, max: 120 },
        ],
    },
    {
        type: 'CompanyInfoBlock',
        label: 'Şirket Bilgileri',
        description: 'Ad, adres, telefon, vergi no',
        category: 'header',
        defaultSettings: { show_phone: true, show_email: true, show_address: true, show_tax: true },
        settingsSchema: [
            { key: 'show_phone', label: 'Telefon', type: 'boolean' },
            { key: 'show_email', label: 'E-posta', type: 'boolean' },
            { key: 'show_address', label: 'Adres', type: 'boolean' },
            { key: 'show_tax', label: 'Vergi bilgisi', type: 'boolean' },
        ],
    },
    {
        type: 'ClientInfoBlock',
        label: 'Müşteri Bilgileri',
        description: 'Ad, iletişim, adres',
        category: 'info',
        defaultSettings: { show_phone: true, show_email: true, show_address: true, show_tax: true },
        settingsSchema: [
            { key: 'show_phone', label: 'Telefon', type: 'boolean' },
            { key: 'show_email', label: 'E-posta', type: 'boolean' },
            { key: 'show_address', label: 'Adres', type: 'boolean' },
            { key: 'show_tax', label: 'TC / Vergi No', type: 'boolean' },
        ],
    },
    {
        type: 'OfferMetaBlock',
        label: 'Teklif Bilgileri',
        description: 'Teklif no, tarih, hazırlayan',
        category: 'info',
        defaultSettings: { show_creator: true, show_date: true, show_validity: true },
        settingsSchema: [
            { key: 'show_creator', label: 'Hazırlayan', type: 'boolean' },
            { key: 'show_date', label: 'Tarih', type: 'boolean' },
            { key: 'show_validity', label: 'Geçerlilik', type: 'boolean' },
        ],
    },
    {
        type: 'InfoGridBlock',
        label: 'İki Kolonlu Bilgi',
        description: 'Müşteri + Teklif yan yana',
        category: 'info',
        defaultSettings: {},
        settingsSchema: [],
    },
    {
        type: 'UnitInfoBlock',
        label: 'Ünite Bilgileri',
        description: 'Blok, no, tip, alan, kat',
        category: 'info',
        defaultSettings: { show_floor: true, show_area: true },
        settingsSchema: [
            { key: 'show_floor', label: 'Kat', type: 'boolean' },
            { key: 'show_area', label: 'Alan (m²)', type: 'boolean' },
        ],
    },
    {
        type: 'PricingTableBlock',
        label: 'Fiyat Tablosu',
        description: 'Baz fiyat, indirim, net fiyat',
        category: 'pricing',
        defaultSettings: { show_base: true, show_discount: true, header_bg: '#0f172a' },
        settingsSchema: [
            { key: 'show_base', label: 'Baz fiyat', type: 'boolean' },
            { key: 'show_discount', label: 'İndirim satırı', type: 'boolean' },
            { key: 'header_bg', label: 'Başlık rengi', type: 'color' },
        ],
    },
    {
        type: 'ValidityBlock',
        label: 'Geçerlilik Tarihi',
        description: 'Teklifin son geçerlilik tarihi',
        category: 'info',
        defaultSettings: {},
        settingsSchema: [],
    },
    {
        type: 'PaymentPlanBlock',
        label: 'Ödeme Planı',
        description: 'Ödeme takvimi metni',
        category: 'pricing',
        defaultSettings: {},
        settingsSchema: [],
    },
    {
        type: 'NotesBlock',
        label: 'Notlar',
        description: 'Özel koşullar ve notlar',
        category: 'info',
        defaultSettings: {},
        settingsSchema: [],
    },
    {
        type: 'SignatureBlock',
        label: 'İmza Alanları',
        description: 'Müşteri ve yetkili imzası',
        category: 'footer',
        defaultSettings: { columns: 3, labels: ['Müşteri / İmza', 'Yetkili / İmza', 'Tarih'] },
        settingsSchema: [
            { key: 'columns', label: 'Kolon sayısı', type: 'select', options: [{ value: '2', label: '2 Kolon' }, { value: '3', label: '3 Kolon' }] },
        ],
    },
    {
        type: 'DividerBlock',
        label: 'Ayraç Çizgisi',
        description: 'Yatay bölücü çizgi',
        category: 'decoration',
        defaultSettings: { thickness: 1, color: '#e2e8f0', margin_top: 4, margin_bottom: 4 },
        settingsSchema: [
            { key: 'thickness', label: 'Kalınlık (px)', type: 'number', min: 1, max: 6 },
            { key: 'color', label: 'Renk', type: 'color' },
            { key: 'margin_top', label: 'Üst boşluk (mm)', type: 'number', min: 0, max: 20 },
            { key: 'margin_bottom', label: 'Alt boşluk (mm)', type: 'number', min: 0, max: 20 },
        ],
    },
    {
        type: 'TextBlock',
        label: 'Serbest Metin',
        description: 'Özel statik metin alanı',
        category: 'decoration',
        defaultSettings: { content: 'Metninizi buraya yazın', align: 'left', font_size: 9 },
        settingsSchema: [
            { key: 'content', label: 'İçerik', type: 'text' },
            { key: 'align', label: 'Hizalama', type: 'select', options: [{ value: 'left', label: 'Sol' }, { value: 'center', label: 'Orta' }, { value: 'right', label: 'Sağ' }] },
            { key: 'font_size', label: 'Font boyutu (pt)', type: 'number', min: 6, max: 18 },
        ],
    },
    {
        type: 'FooterBlock',
        label: 'Alt Bilgi',
        description: 'Şirket bilgisi ve sayfa notu',
        category: 'footer',
        defaultSettings: {},
        settingsSchema: [],
    },
];

export const CATEGORY_LABELS: Record<string, string> = {
    header: 'Başlık',
    info: 'Bilgi Alanları',
    pricing: 'Fiyatlandırma',
    footer: 'Alt Bölüm',
    decoration: 'Düzen',
};

export function getBlockCatalogueItem(type: BlockType): BlockCatalogueItem {
    return BLOCK_CATALOGUE.find(b => b.type === type) ?? BLOCK_CATALOGUE[0];
}
