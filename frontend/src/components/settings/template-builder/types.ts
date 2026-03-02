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

export interface PageSettings {
    margin: number;
    font_size: number;
}

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
    icon: string; // emoji icon for palette
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
        icon: '🏷️',
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
        description: 'Ad, adres, telefon, vergi',
        icon: '🏢',
        category: 'header',
        defaultSettings: { show_phone: true, show_email: true, show_address: true, show_tax: true },
        settingsSchema: [
            { key: 'show_phone', label: 'Telefon göster', type: 'boolean' },
            { key: 'show_email', label: 'E-posta göster', type: 'boolean' },
            { key: 'show_address', label: 'Adres göster', type: 'boolean' },
            { key: 'show_tax', label: 'Vergi bilgisi göster', type: 'boolean' },
        ],
    },
    {
        type: 'ClientInfoBlock',
        label: 'Müşteri Bilgileri',
        description: 'Müşteri adı, iletişim, adres',
        icon: '👤',
        category: 'info',
        defaultSettings: { show_phone: true, show_email: true, show_address: true, show_tax: true },
        settingsSchema: [
            { key: 'show_phone', label: 'Telefon göster', type: 'boolean' },
            { key: 'show_email', label: 'E-posta göster', type: 'boolean' },
            { key: 'show_address', label: 'Adres göster', type: 'boolean' },
            { key: 'show_tax', label: 'Vergi bilgisi göster', type: 'boolean' },
        ],
    },
    {
        type: 'OfferMetaBlock',
        label: 'Teklif Bilgileri',
        description: 'Teklif no, tarih, hazırlayan',
        icon: '📋',
        category: 'info',
        defaultSettings: { show_creator: true, show_date: true, show_validity: true },
        settingsSchema: [
            { key: 'show_creator', label: 'Hazırlayan göster', type: 'boolean' },
            { key: 'show_date', label: 'Tarih göster', type: 'boolean' },
            { key: 'show_validity', label: 'Geçerlilik göster', type: 'boolean' },
        ],
    },
    {
        type: 'InfoGridBlock',
        label: 'İki Kolonlu Bilgi',
        description: 'Müşteri + Teklif bilgisi yan yana',
        icon: '⬛',
        category: 'info',
        defaultSettings: {},
        settingsSchema: [],
    },
    {
        type: 'UnitInfoBlock',
        label: 'Ünite Bilgileri',
        description: 'Blok, no, tip, alan, kat',
        icon: '🏠',
        category: 'info',
        defaultSettings: { show_floor: true, show_area: true },
        settingsSchema: [
            { key: 'show_floor', label: 'Kat göster', type: 'boolean' },
            { key: 'show_area', label: 'Alan göster', type: 'boolean' },
        ],
    },
    {
        type: 'PricingTableBlock',
        label: 'Fiyat Tablosu',
        description: 'Baz fiyat, indirim, net fiyat',
        icon: '💰',
        category: 'pricing',
        defaultSettings: { show_base: true, show_discount: true, header_bg: '#0f172a' },
        settingsSchema: [
            { key: 'show_base', label: 'Baz fiyat göster', type: 'boolean' },
            { key: 'show_discount', label: 'İndirim göster', type: 'boolean' },
            { key: 'header_bg', label: 'Başlık rengi', type: 'color' },
        ],
    },
    {
        type: 'ValidityBlock',
        label: 'Geçerlilik Tarihi',
        description: 'Teklifin geçerlilik bilgisi',
        icon: '📅',
        category: 'info',
        defaultSettings: {},
        settingsSchema: [],
    },
    {
        type: 'PaymentPlanBlock',
        label: 'Ödeme Planı',
        description: 'Ödeme planı metni',
        icon: '💳',
        category: 'pricing',
        defaultSettings: {},
        settingsSchema: [],
    },
    {
        type: 'NotesBlock',
        label: 'Notlar',
        description: 'Özel notlar ve koşullar',
        icon: '📝',
        category: 'info',
        defaultSettings: {},
        settingsSchema: [],
    },
    {
        type: 'SignatureBlock',
        label: 'İmza Alanları',
        description: 'Müşteri ve yetkili imzası',
        icon: '✍️',
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
        icon: '➖',
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
        description: 'Özel statik metin',
        icon: '📄',
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
        description: 'Şirket bilgisi + sayfa notu',
        icon: '📌',
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
    decoration: 'Dekor & Düzen',
};

export function getBlockCatalogueItem(type: BlockType): BlockCatalogueItem {
    return BLOCK_CATALOGUE.find(b => b.type === type) ?? BLOCK_CATALOGUE[0];
}
