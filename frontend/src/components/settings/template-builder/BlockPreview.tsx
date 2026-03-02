'use client';
// Visual preview renderers for each block type on the A4 canvas
// These render sample/placeholder content to show the layout

import React from 'react';
import { TemplateBlock, getBlockCatalogueItem } from './types';

interface BlockPreviewProps {
    block: TemplateBlock;
    selected?: boolean;
}

// ─── Shared tiny building blocks ─────────────────────────────────────

const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 7, color: '#94a3b8', minWidth: 64, flexShrink: 0 }}>{label}</span>
        <span style={{ fontSize: 7, color: '#334155', fontWeight: 500 }}>{value}</span>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4, marginTop: 2 }}>
        {children}
    </div>
);

// ─── Block Preview Renderers ──────────────────────────────────────────

function LogoBlockPreview({ settings }: { settings: Record<string, unknown> }) {
    const align = (settings.align as string) || 'left';
    return (
        <div style={{ display: 'flex', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start', padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#0f172a,#1e40af)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>B</span>
                </div>
                <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>Belcon</div>
                    <div style={{ fontSize: 6, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gayrimenkul & İnşaat</div>
                </div>
            </div>
        </div>
    );
}

function DividerBlockPreview({ settings }: { settings: Record<string, unknown> }) {
    const color = (settings.color as string) || '#e2e8f0';
    const thickness = (settings.thickness as number) || 1;
    const mt = (settings.margin_top as number) || 4;
    const mb = (settings.margin_bottom as number) || 4;
    return <div style={{ height: thickness, background: color, marginTop: mt, marginBottom: mb }} />;
}

function InfoGridBlockPreview() {
    return (
        <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 7px' }}>
                <SectionTitle>Müşteri Bilgileri</SectionTitle>
                <Row label="Ad / Unvan" value="Ahmet Yılmaz" />
                <Row label="Telefon" value="+90 532 000 0000" />
                <Row label="E-posta" value="ahmet@mail.com" />
            </div>
            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 7px' }}>
                <SectionTitle>Teklif Detayları</SectionTitle>
                <Row label="Konut" value="A Blok / No: 12" />
                <Row label="Tip" value="2+1  ·  85 m²" />
                <Row label="Teklif Tarihi" value="02.03.2026" />
                <Row label="Hazırlayan" value="Admin Kullanıcı" />
            </div>
        </div>
    );
}

function PricingTableBlockPreview({ settings }: { settings: Record<string, unknown> }) {
    const headerBg = (settings.header_bg as string) || '#0f172a';
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7.5 }}>
            <thead>
                <tr>
                    {['Açıklama', 'Tutar'].map(h => (
                        <th key={h} style={{ background: headerBg, color: '#fff', padding: '3px 6px', textAlign: h === 'Tutar' ? 'right' : 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr><td style={{ padding: '2.5px 6px' }}>Liste Fiyatı</td><td style={{ padding: '2.5px 6px', textAlign: 'right' }}>2.500.000 ₺</td></tr>
                {settings.show_discount !== false && <tr><td style={{ padding: '2.5px 6px', color: '#dc2626' }}>İndirim</td><td style={{ padding: '2.5px 6px', textAlign: 'right', color: '#dc2626' }}>- 100.000 ₺</td></tr>}
                <tr style={{ background: '#f1f5f9' }}>
                    <td style={{ padding: '3px 6px', fontWeight: 700 }}>Net Fiyat</td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 700, fontSize: 9 }}>2.400.000 ₺</td>
                </tr>
            </tbody>
        </table>
    );
}

function ValidityBlockPreview() {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 8px', fontSize: 7.5 }}>
            <span style={{ color: '#64748b' }}>Bu teklif aşağıdaki tarihe kadar geçerlidir:</span>
            <span style={{ fontWeight: 700 }}>31.03.2026</span>
        </div>
    );
}

function PaymentPlanBlockPreview() {
    return (
        <div>
            <SectionTitle>Ödeme Planı</SectionTitle>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 7.5, color: '#334155', lineHeight: 1.5 }}>
                %25 Kaparo: 600.000 ₺  (Sözleşme imzasında){'\n'}
                %25 Temel atımında: 600.000 ₺{'\n'}
                %50 Teslimde: 1.200.000 ₺
            </div>
        </div>
    );
}

function NotesBlockPreview() {
    return (
        <div>
            <SectionTitle>Notlar ve Özel Koşullar</SectionTitle>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 7.5, color: '#334155', lineHeight: 1.5 }}>
                İşbu teklif, taraflar arasında imzalanacak resmi satış sözleşmesinin yerini tutmaz. Fiyatlara KDV dahil değildir.
            </div>
        </div>
    );
}

function SignatureBlockPreview({ settings }: { settings: Record<string, unknown> }) {
    const cols = Number(settings.columns) || 3;
    const labels = (settings.labels as string[]) || ['Müşteri / İmza', 'Yetkili / İmza', 'Tarih'];
    return (
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {labels.slice(0, cols).map((label, i) => (
                <div key={i} style={{ flex: 1 }}>
                    <div style={{ height: 20, borderTop: '1px solid #cbd5e1', marginBottom: 2 }} />
                    <span style={{ fontSize: 6.5, color: '#64748b' }}>{label}</span>
                </div>
            ))}
        </div>
    );
}

function FooterBlockPreview() {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 5, borderTop: '1px solid #e2e8f0', marginTop: 4 }}>
            <div style={{ fontSize: 6.5, color: '#94a3b8', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 7 }}>Belcon Gayrimenkul</div>
                <div>Atatürk Cad. No:1 İstanbul</div>
                <div>VKN: 1234567890 / Kadıköy VD</div>
            </div>
            <div style={{ fontSize: 6.5, color: '#94a3b8', textAlign: 'right' }}>
                <div>Bu belge elektronik ortamda oluşturulmuştur.</div>
                <div>TKF-2026-0001  ·  02.03.2026</div>
            </div>
        </div>
    );
}

function TextBlockPreview({ settings }: { settings: Record<string, unknown> }) {
    const align = (settings.align as string) || 'left';
    const fontSize = (settings.font_size as number) || 9;
    return (
        <div style={{ textAlign: align as 'left' | 'center' | 'right', fontSize, color: '#334155' }}>
            {(settings.content as string) || 'Serbest metin alanı'}
        </div>
    );
}

function CompanyInfoBlockPreview({ settings }: { settings: Record<string, unknown> }) {
    return (
        <div style={{ fontSize: 7.5, color: '#334155', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 9 }}>Belcon Gayrimenkul A.Ş.</div>
            {settings.show_address !== false && <div>Atatürk Cad. No:1 Kadıköy / İstanbul</div>}
            {settings.show_phone !== false && <div>Tel: +90 212 000 0000</div>}
            {settings.show_email !== false && <div>E-posta: info@belcon.com.tr</div>}
            {settings.show_tax !== false && <div>VKN: 1234567890 / Kadıköy Vergi Dairesi</div>}
        </div>
    );
}

function ClientInfoBlockPreview({ settings }: { settings: Record<string, unknown> }) {
    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 7px' }}>
            <SectionTitle>Müşteri Bilgileri</SectionTitle>
            <Row label="Ad / Unvan" value="Ahmet Yılmaz" />
            {settings.show_phone !== false && <Row label="Telefon" value="+90 532 000 0000" />}
            {settings.show_email !== false && <Row label="E-posta" value="ahmet@mail.com" />}
            {settings.show_address !== false && <Row label="Adres" value="Bağcılar / İstanbul" />}
            {settings.show_tax !== false && <Row label="TC No" value="12345678901" />}
        </div>
    );
}

function OfferMetaBlockPreview({ settings }: { settings: Record<string, unknown> }) {
    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 7px' }}>
            <SectionTitle>Teklif Bilgileri</SectionTitle>
            <Row label="Teklif No" value="TKF-2026-0001" />
            {settings.show_date !== false && <Row label="Tarih" value="02.03.2026" />}
            {settings.show_validity !== false && <Row label="Geçerlilik" value="31.03.2026" />}
            {settings.show_creator !== false && <Row label="Hazırlayan" value="Admin Kullanıcı" />}
        </div>
    );
}

function UnitInfoBlockPreview({ settings }: { settings: Record<string, unknown> }) {
    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 7px' }}>
            <SectionTitle>Ünite Bilgileri</SectionTitle>
            <Row label="Konut" value="A Blok / No: 12" />
            <Row label="Tip" value="2+1" />
            {settings.show_area !== false && <Row label="Net Alan" value="85 m²" />}
            {settings.show_floor !== false && <Row label="Kat" value="4. Kat" />}
        </div>
    );
}

// ─── Main dispatcher ──────────────────────────────────────────────────

const RENDERERS: Record<string, React.ComponentType<{ settings: Record<string, unknown> }>> = {
    LogoBlock: LogoBlockPreview,
    DividerBlock: DividerBlockPreview,
    InfoGridBlock: InfoGridBlockPreview,
    PricingTableBlock: PricingTableBlockPreview,
    ValidityBlock: ValidityBlockPreview,
    PaymentPlanBlock: PaymentPlanBlockPreview,
    NotesBlock: NotesBlockPreview,
    SignatureBlock: SignatureBlockPreview,
    FooterBlock: FooterBlockPreview,
    TextBlock: TextBlockPreview,
    CompanyInfoBlock: CompanyInfoBlockPreview,
    ClientInfoBlock: ClientInfoBlockPreview,
    OfferMetaBlock: OfferMetaBlockPreview,
    UnitInfoBlock: UnitInfoBlockPreview,
};

export function BlockPreview({ block, selected }: BlockPreviewProps) {
    const meta = getBlockCatalogueItem(block.type);
    const Renderer = RENDERERS[block.type];

    return (
        <div
            style={{
                padding: '6px 8px',
                borderRadius: 5,
                border: selected ? '2px solid #3b82f6' : '1.5px dashed transparent',
                background: selected ? '#eff6ff' : 'transparent',
                transition: 'border 0.15s, background 0.15s',
                position: 'relative',
            }}
        >
            {/* Block type label on hover/select */}
            {selected && (
                <div style={{
                    position: 'absolute', top: -10, left: 6, background: '#3b82f6',
                    color: '#fff', fontSize: 9, padding: '1px 6px', borderRadius: 3, fontWeight: 600, whiteSpace: 'nowrap'
                }}>
                    {meta.icon} {meta.label}
                </div>
            )}
            {Renderer ? <Renderer settings={block.settings} /> : (
                <div style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center', padding: 8 }}>
                    {meta.icon} {meta.label}
                </div>
            )}
        </div>
    );
}
