'use client';

import React from 'react';
import { TemplateBlock, getBlockCatalogueItem } from './types';

interface BlockPreviewProps {
    block: TemplateBlock;
    selected?: boolean;
}

// ─── Extract style overrides from block settings ──────────────────────

function extractStyle(settings: Record<string, unknown>): React.CSSProperties {
    const s: React.CSSProperties = {};
    if (settings._bg_color) s.backgroundColor = settings._bg_color as string;
    if (settings._text_color) s.color = settings._text_color as string;
    if (settings._font_size) s.fontSize = `${settings._font_size}pt`;
    if (settings._font_weight === 'bold') s.fontWeight = 700;
    if (settings._border_width && settings._border_color) {
        s.border = `${settings._border_width}px solid ${settings._border_color}`;
        s.borderRadius = 3;
    }
    if (settings._padding) s.padding = `${settings._padding}mm`;
    if (settings._margin_top) s.marginTop = `${settings._margin_top}mm`;
    if (settings._margin_bottom) s.marginBottom = `${settings._margin_bottom}mm`;
    return s;
}

// ─── Shared micro-components ──────────────────────────────────────────

const Row = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 7, color: '#94a3b8', minWidth: 68, flexShrink: 0 }}>{label}</span>
        <span style={{ fontSize: 7, color: color ?? '#334155', fontWeight: 500 }}>{value}</span>
    </div>
);

const STitle = ({ children, color }: { children: React.ReactNode; color?: string }) => (
    <div style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: color ?? '#94a3b8', marginBottom: 4 }}>
        {children}
    </div>
);

const InfoBox = ({ title, children, bg }: { title: string; children: React.ReactNode; bg?: string }) => (
    <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 7px', background: bg ?? 'transparent' }}>
        <STitle>{title}</STitle>
        {children}
    </div>
);

// ─── Block Renderers ──────────────────────────────────────────────────

function LogoBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    const align = (settings.align as string) || 'left';
    return (
        <div style={{ display: 'flex', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start', padding: '3px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg,#0f172a,#1e40af)', borderRadius: 4 }} />
                <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'inherit', letterSpacing: '-0.02em' }}>Belcon</div>
                    <div style={{ fontSize: 6, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gayrimenkul</div>
                </div>
            </div>
        </div>
    );
}

function DividerBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    return (
        <div style={{
            height: (settings.thickness as number) || 1,
            background: (settings.color as string) || '#e2e8f0',
            marginTop: (settings.margin_top as number) || 3,
            marginBottom: (settings.margin_bottom as number) || 3,
        }} />
    );
}

function InfoGridBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    const bg = (settings._bg_color as string) ?? undefined;
    return (
        <div style={{ display: 'flex', gap: 8 }}>
            <InfoBox title="Müşteri Bilgileri" bg={bg}>
                <Row label="Ad / Unvan" value="Ahmet Yılmaz" />
                <Row label="Telefon" value="+90 532 000 0000" />
                <Row label="E-posta" value="ahmet@mail.com" />
            </InfoBox>
            <InfoBox title="Teklif Detayları" bg={bg}>
                <Row label="Konut" value="A Blok / No: 12" />
                <Row label="Tip" value="2+1  ·  85 m²" />
                <Row label="Teklif Tarihi" value="02.03.2026" />
            </InfoBox>
        </div>
    );
}

function PricingTableBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    const hBg = (settings.header_bg as string) || '#0f172a';
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7.5 }}>
            <thead>
                <tr>
                    <th style={{ background: hBg, color: '#fff', padding: '3px 6px', textAlign: 'left', fontWeight: 600 }}>Açıklama</th>
                    <th style={{ background: hBg, color: '#fff', padding: '3px 6px', textAlign: 'right', fontWeight: 600 }}>Tutar</th>
                </tr>
            </thead>
            <tbody>
                <tr><td style={{ padding: '2.5px 6px' }}>Liste Fiyatı</td><td style={{ padding: '2.5px 6px', textAlign: 'right' }}>2.500.000 ₺</td></tr>
                {settings.show_discount !== false && (
                    <tr><td style={{ padding: '2.5px 6px', color: '#dc2626' }}>İndirim</td><td style={{ padding: '2.5px 6px', textAlign: 'right', color: '#dc2626' }}>- 100.000 ₺</td></tr>
                )}
                <tr style={{ background: '#f1f5f9' }}>
                    <td style={{ padding: '3px 6px', fontWeight: 700 }}>Net Fiyat</td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 700, fontSize: 9 }}>2.400.000 ₺</td>
                </tr>
            </tbody>
        </table>
    );
}

function ValidityBlockRenderer() {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 8px', fontSize: 7.5 }}>
            <span style={{ color: '#64748b' }}>Bu teklif aşağıdaki tarihe kadar geçerlidir:</span>
            <span style={{ fontWeight: 700 }}>31.03.2026</span>
        </div>
    );
}

function PaymentPlanBlockRenderer() {
    return (
        <div>
            <STitle>Ödeme Planı</STitle>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 7.5, color: '#334155', lineHeight: 1.5 }}>
                %25 Kaparo: 600.000 ₺ — Sözleşme imzasında<br />
                %25 Temel atımında: 600.000 ₺<br />
                %50 Teslimde: 1.200.000 ₺
            </div>
        </div>
    );
}

function NotesBlockRenderer() {
    return (
        <div>
            <STitle>Notlar ve Özel Koşullar</STitle>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 7.5, color: '#334155', lineHeight: 1.5 }}>
                İşbu teklif resmi satış sözleşmesinin yerini tutmaz. Fiyatlara KDV dahil değildir.
            </div>
        </div>
    );
}

function SignatureBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    const cols = Number(settings.columns) || 3;
    const labels = (settings.labels as string[]) || ['Müşteri / İmza', 'Yetkili / İmza', 'Tarih'];
    return (
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {labels.slice(0, cols).map((label, i) => (
                <div key={i} style={{ flex: 1 }}>
                    <div style={{ height: 18, borderTop: `1px solid ${(settings._border_color as string) ?? '#cbd5e1'}`, marginBottom: 2 }} />
                    <span style={{ fontSize: 6.5, color: '#64748b' }}>{label}</span>
                </div>
            ))}
        </div>
    );
}

function FooterBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    const tc = (settings._text_color as string) ?? '#94a3b8';
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 5, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 6.5, color: tc, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 7 }}>Belcon Gayrimenkul</div>
                <div>Atatürk Cad. No:1 Kadıköy / İstanbul</div>
                <div>VKN: 1234567890 / Kadıköy VD</div>
            </div>
            <div style={{ fontSize: 6.5, color: tc, textAlign: 'right' }}>
                <div>TKF-2026-0001 · 02.03.2026</div>
            </div>
        </div>
    );
}

function TextBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    return (
        <div style={{ textAlign: ((settings.align as string) || 'left') as 'left' | 'center' | 'right', fontSize: (settings.font_size as number) || 9, color: 'inherit' }}>
            {(settings.content as string) || 'Serbest metin alanı'}
        </div>
    );
}

function CompanyInfoBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    const tc = (settings._text_color as string) ?? '#334155';
    return (
        <div style={{ fontSize: 7.5, color: tc, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: 'inherit', fontSize: 9, marginBottom: 2 }}>Belcon Gayrimenkul A.Ş.</div>
            {settings.show_address !== false && <div>Atatürk Cad. No:1 Kadıköy / İstanbul</div>}
            {settings.show_phone !== false && <div>Tel: +90 212 000 0000</div>}
            {settings.show_email !== false && <div>info@belcon.com.tr</div>}
            {settings.show_tax !== false && <div>VKN: 1234567890 / Kadıköy Vergi Dairesi</div>}
        </div>
    );
}

function ClientInfoBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    return (
        <InfoBox title="Müşteri Bilgileri">
            <Row label="Ad / Unvan" value="Ahmet Yılmaz" />
            {settings.show_phone !== false && <Row label="Telefon" value="+90 532 000 0000" />}
            {settings.show_email !== false && <Row label="E-posta" value="ahmet@mail.com" />}
            {settings.show_address !== false && <Row label="Adres" value="Bağcılar / İstanbul" />}
        </InfoBox>
    );
}

function OfferMetaBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    return (
        <InfoBox title="Teklif Bilgileri">
            <Row label="Teklif No" value="TKF-2026-0001" />
            {settings.show_date !== false && <Row label="Tarih" value="02.03.2026" />}
            {settings.show_validity !== false && <Row label="Geçerlilik" value="31.03.2026" />}
            {settings.show_creator !== false && <Row label="Hazırlayan" value="Admin Kullanıcı" />}
        </InfoBox>
    );
}

function UnitInfoBlockRenderer({ settings }: { settings: Record<string, unknown> }) {
    return (
        <InfoBox title="Ünite Bilgileri">
            <Row label="Konut" value="A Blok / No: 12" />
            <Row label="Tip" value="2+1" />
            {settings.show_area !== false && <Row label="Net Alan" value="85 m²" />}
            {settings.show_floor !== false && <Row label="Kat" value="4. Kat" />}
        </InfoBox>
    );
}

// ─── Dispatcher ───────────────────────────────────────────────────────

const RENDERERS: Record<string, React.ComponentType<{ settings: Record<string, unknown> }>> = {
    LogoBlock: LogoBlockRenderer,
    DividerBlock: DividerBlockRenderer,
    InfoGridBlock: InfoGridBlockRenderer,
    PricingTableBlock: PricingTableBlockRenderer,
    ValidityBlock: ValidityBlockRenderer,
    PaymentPlanBlock: PaymentPlanBlockRenderer,
    NotesBlock: NotesBlockRenderer,
    SignatureBlock: SignatureBlockRenderer,
    FooterBlock: FooterBlockRenderer,
    TextBlock: TextBlockRenderer,
    CompanyInfoBlock: CompanyInfoBlockRenderer,
    ClientInfoBlock: ClientInfoBlockRenderer,
    OfferMetaBlock: OfferMetaBlockRenderer,
    UnitInfoBlock: UnitInfoBlockRenderer,
};

export function BlockPreview({ block, selected }: BlockPreviewProps) {
    const meta = getBlockCatalogueItem(block.type);
    const Renderer = RENDERERS[block.type];
    const overrideStyle = extractStyle(block.settings);

    return (
        <div style={{
            ...overrideStyle,
            padding: overrideStyle.padding ?? '5px 6px',
            borderRadius: overrideStyle.borderRadius ?? 3,
            border: selected
                ? '1.5px solid #3b82f6'
                : overrideStyle.border ?? '1.5px dashed transparent',
            background: overrideStyle.backgroundColor ?? 'transparent',
            position: 'relative',
            transition: 'border 0.1s',
        }}>
            {selected && (
                <div style={{
                    position: 'absolute', top: -9, left: 4,
                    background: '#3b82f6', color: '#fff',
                    fontSize: 8, padding: '1px 5px', borderRadius: 2,
                    fontWeight: 600, letterSpacing: '0.04em',
                    whiteSpace: 'nowrap', zIndex: 10,
                }}>
                    {meta.label}
                </div>
            )}
            {Renderer
                ? <Renderer settings={block.settings} />
                : <div style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center', padding: 6 }}>{meta.label}</div>
            }
        </div>
    );
}
