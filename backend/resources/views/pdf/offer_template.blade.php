<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teklif {{ $offer->offer_no }}</title>
    <style>
        /* ─── Reset & Base ─────────────────────────────── */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        html, body {
            width: 210mm;
            font-family: 'DejaVu Sans', 'Arial', sans-serif;
            font-size: 9pt;
            color: #1e293b;
            background: #fff;
        }

        /* ─── Page wrapper ─────────────────────────────── */
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 14mm 16mm 18mm;
            display: flex;
            flex-direction: column;
        }

        /* ─── Typography ───────────────────────────────── */
        h1 { font-size: 20pt; font-weight: 700; }
        h2 { font-size: 10pt; font-weight: 600; }
        h3 { font-size: 8.5pt; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #475569; }

        /* ─── Header ───────────────────────────────────── */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 10mm;
            border-bottom: 2px solid #0f172a;
            margin-bottom: 8mm;
        }

        .logo-block { display: flex; align-items: center; gap: 8px; }
        .logo-block img { max-height: 48px; max-width: 140px; object-fit: contain; }
        .logo-text {
            display: flex;
            flex-direction: column;
        }
        .logo-text .company { font-size: 13pt; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
        .logo-text .tagline { font-size: 7pt; color: #64748b; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 1px; }

        .header-right { text-align: right; }
        .offer-label {
            font-size: 7.5pt;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 2px;
        }
        .offer-no { font-size: 17pt; font-weight: 700; color: #0f172a; }

        /* ─── Status badge ─────────────────────────────── */
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            margin-top: 4px;
        }
        .status-draft    { background: #f1f5f9; color: #475569; }
        .status-sent     { background: #dbeafe; color: #1d4ed8; }
        .status-accepted { background: #dcfce7; color: #15803d; }
        .status-rejected { background: #fee2e2; color: #b91c1c; }

        /* ─── Two-col info grid ─────────────────────────── */
        .info-grid {
            display: flex;
            gap: 6mm;
            margin-bottom: 7mm;
        }
        .info-box {
            flex: 1;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 5mm 6mm;
        }
        .info-box-title {
            font-size: 7pt;
            font-weight: 700;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: #94a3b8;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 3px;
            margin-bottom: 5px;
        }
        .info-row { display: flex; align-items: baseline; margin-bottom: 3px; gap: 4px; }
        .info-label { font-size: 7.5pt; color: #64748b; min-width: 70px; flex-shrink: 0; }
        .info-value { font-size: 7.5pt; font-weight: 600; color: #1e293b; }

        /* ─── Section heading ───────────────────────────── */
        .section-title {
            font-size: 7pt;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #94a3b8;
            margin-bottom: 3mm;
            margin-top: 5mm;
        }

        /* ─── Pricing table ─────────────────────────────── */
        .price-table { width: 100%; border-collapse: collapse; }
        .price-table th {
            background: #0f172a;
            color: #fff;
            font-size: 7.5pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 4.5pt 8pt;
            text-align: left;
        }
        .price-table th:last-child, .price-table td:last-child { text-align: right; }
        .price-table td {
            padding: 5pt 8pt;
            font-size: 8.5pt;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
        }
        .price-table tr:nth-child(even) td { background: #f8fafc; }
        .price-table .total-row td {
            background: #f1f5f9;
            font-weight: 700;
            font-size: 9.5pt;
            color: #0f172a;
            border-top: 2px solid #e2e8f0;
            border-bottom: none;
        }
        .price-table .discount-val { color: #dc2626; }
        .price-table .net-val { color: #0f172a; font-size: 10pt; }

        /* ─── Payment / Notes ───────────────────────────── */
        .text-block {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 5mm 6mm;
            margin-bottom: 4mm;
        }
        .text-block p {
            font-size: 8.5pt;
            color: #334155;
            line-height: 1.55;
            white-space: pre-line;
        }

        /* ─── Validity / validity ───────────────────────── */
        .validity-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 4mm 6mm;
            margin-bottom: 4mm;
        }
        .validity-bar .label { font-size: 7.5pt; color: #64748b; }
        .validity-bar .val { font-size: 9pt; font-weight: 700; color: #0f172a; }

        /* ─── Signature area ────────────────────────────── */
        .sig-grid {
            display: flex;
            gap: 8mm;
            margin-top: 8mm;
        }
        .sig-box { flex: 1; }
        .sig-line {
            border-top: 1px solid #cbd5e1;
            margin-top: 14mm;
            padding-top: 3px;
        }
        .sig-label { font-size: 7.5pt; color: #64748b; }

        /* ─── Footer ────────────────────────────────────── */
        .footer {
            margin-top: auto;
            padding-top: 6mm;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .footer-left { font-size: 7pt; color: #94a3b8; line-height: 1.5; }
        .footer-right { font-size: 7pt; color: #94a3b8; text-align: right; }
        .footer-brand { font-size: 7.5pt; font-weight: 700; color: #0f172a; }
    </style>
</head>
<body>
<div class="page">

    {{-- ══ HEADER ══════════════════════════════════════════ --}}
    <div class="header">
        <div class="logo-block">
            @php
                $project = $offer->project;
                $logoUrl = null;
                if ($project && $project->logo_path) {
                    $logoUrl = storage_path('app/public/' . $project->logo_path);
                }
                $companyName = ($project && $project->company_name) ? $project->company_name : ($project->name ?? 'Belcon');
            @endphp

            @if($logoUrl && file_exists($logoUrl))
                <img src="{{ $logoUrl }}" alt="{{ $companyName }}">
            @else
                <div class="logo-text">
                    <span class="company">{{ $companyName }}</span>
                    <span class="tagline">Gayrimenkul & İnşaat</span>
                </div>
            @endif
        </div>

        <div class="header-right">
            <div class="offer-label">Satış Teklifi</div>
            <div class="offer-no">{{ $offer->offer_no }}</div>
            @php
                $statusMap = [
                    'draft'    => ['Taslak',       'status-draft'],
                    'sent'     => ['Gönderildi',   'status-sent'],
                    'accepted' => ['Kabul Edildi', 'status-accepted'],
                    'rejected' => ['Reddedildi',   'status-rejected'],
                ];
                [$statusLabel, $statusClass] = $statusMap[$offer->status] ?? [$offer->status, 'status-draft'];
            @endphp
            <span class="status-badge {{ $statusClass }}">{{ $statusLabel }}</span>
        </div>
    </div>

    {{-- ══ INFO GRID ════════════════════════════════════════ --}}
    <div class="info-grid">
        {{-- Müşteri --}}
        <div class="info-box">
            <div class="info-box-title">Müşteri Bilgileri</div>
            @if($offer->customer)
            @php
                $c = $offer->customer;
                $cName = $c->type === 'corporate' ? $c->company_name : "{$c->first_name} {$c->last_name}";
            @endphp
            <div class="info-row"><span class="info-label">Ad / Unvan</span><span class="info-value">{{ $cName }}</span></div>
            @if($c->phone)
            <div class="info-row"><span class="info-label">Telefon</span><span class="info-value">{{ $c->phone }}</span></div>
            @endif
            @if($c->email)
            <div class="info-row"><span class="info-label">E-posta</span><span class="info-value">{{ $c->email }}</span></div>
            @endif
            @if($c->address)
            <div class="info-row"><span class="info-label">Adres</span><span class="info-value">{{ $c->address }}{{ $c->city ? ', '.$c->city : '' }}</span></div>
            @endif
            @if($c->type === 'corporate' && $c->tax_number)
            <div class="info-row"><span class="info-label">Vergi No</span><span class="info-value">{{ $c->tax_number }} / {{ $c->tax_office }}</span></div>
            @endif
            @endif
        </div>

        {{-- Ünite --}}
        <div class="info-box">
            <div class="info-box-title">Teklif Detayları</div>
            @if($offer->unit)
            @php $u = $offer->unit; @endphp
            <div class="info-row"><span class="info-label">Konut</span><span class="info-value">{{ $u->block->name ?? '' }} Blok / No: {{ $u->unit_no }}</span></div>
            <div class="info-row"><span class="info-label">Tip</span><span class="info-value">{{ $u->unit_type ?? '-' }}</span></div>
            @if($u->net_area)
            <div class="info-row"><span class="info-label">Net Alan</span><span class="info-value">{{ $u->net_area }} m²</span></div>
            @endif
            @if($u->gross_area)
            <div class="info-row"><span class="info-label">Brüt Alan</span><span class="info-value">{{ $u->gross_area }} m²</span></div>
            @endif
            @if($u->floor_no !== null)
            <div class="info-row"><span class="info-label">Kat</span><span class="info-value">{{ $u->floor_no }}. Kat</span></div>
            @endif
            @endif
            <div class="info-row"><span class="info-label">Teklif Tarihi</span><span class="info-value">{{ $offer->created_at ? $offer->created_at->format('d.m.Y') : '-' }}</span></div>
            @if($offer->creator)
            <div class="info-row"><span class="info-label">Hazırlayan</span><span class="info-value">{{ $offer->creator->name }}</span></div>
            @endif
        </div>
    </div>

    {{-- ══ FİYATLANDIRMA ════════════════════════════════════ --}}
    <div class="section-title">Fiyatlandırma</div>
    <table class="price-table">
        <thead>
            <tr>
                <th style="width:55%">Açıklama</th>
                <th style="width:20%;text-align:right">Birim Fiyat</th>
                <th style="width:25%;text-align:right">Tutar</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Liste / Baz Satış Fiyatı</td>
                <td style="text-align:right">{{ number_format($offer->base_price, 0, ',', '.') }} ₺</td>
                <td style="text-align:right">{{ number_format($offer->base_price, 0, ',', '.') }} ₺</td>
            </tr>
            @if($offer->discount_amount > 0)
            <tr>
                <td>Özel İndirim</td>
                <td style="text-align:right" class="discount-val">- {{ number_format($offer->discount_amount, 0, ',', '.') }} ₺</td>
                <td style="text-align:right" class="discount-val">- {{ number_format($offer->discount_amount, 0, ',', '.') }} ₺</td>
            </tr>
            @endif
            <tr class="total-row">
                <td colspan="2">Net Teklif Fiyatı (KDV Hariç)</td>
                <td class="net-val">{{ number_format($offer->final_price, 0, ',', '.') }} ₺</td>
            </tr>
        </tbody>
    </table>

    {{-- ══ GEÇERLİLİK ═══════════════════════════════════════ --}}
    @if($offer->valid_until)
    <div class="validity-bar" style="margin-top:4mm">
        <span class="label">Bu teklif aşağıdaki tarihe kadar geçerlidir:</span>
        <span class="val">{{ \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') }}</span>
    </div>
    @endif

    {{-- ══ ÖDEME PLANI ══════════════════════════════════════ --}}
    @if($offer->payment_plan)
    <div class="section-title" style="margin-top:5mm">Ödeme Planı</div>
    <div class="text-block">
        <p>{{ $offer->payment_plan }}</p>
    </div>
    @endif

    {{-- ══ NOTLAR ═══════════════════════════════════════════ --}}
    @if($offer->notes)
    <div class="section-title">Notlar ve Özel Koşullar</div>
    <div class="text-block">
        <p>{{ $offer->notes }}</p>
    </div>
    @endif

    {{-- ══ İMZA ════════════════════════════════════════════ --}}
    <div class="sig-grid">
        <div class="sig-box">
            <div class="sig-line">
                <span class="sig-label">Müşteri Adı Soyadı / İmza</span>
            </div>
        </div>
        <div class="sig-box">
            <div class="sig-line">
                <span class="sig-label">Yetkili Temsilci / İmza</span>
            </div>
        </div>
        <div class="sig-box">
            <div class="sig-line">
                <span class="sig-label">Tarih</span>
            </div>
        </div>
    </div>

    {{-- ══ FOOTER ═══════════════════════════════════════════ --}}
    <div class="footer">
        <div class="footer-left">
            @if($offer->project)
            @php $p = $offer->project; @endphp
            <div class="footer-brand">{{ $p->company_name ?? $p->name }}</div>
            @if($p->company_address)<div>{{ $p->company_address }}</div>@endif
            @if($p->company_phone)<div>Tel: {{ $p->company_phone }}{{ $p->company_email ? '  |  ' . $p->company_email : '' }}</div>@endif
            @if($p->tax_number)<div>VKN: {{ $p->tax_number }} / {{ $p->tax_office }}</div>@endif
            @endif
        </div>
        <div class="footer-right">
            <div>Bu belge elektronik ortamda oluşturulmuştur.</div>
            <div>{{ $offer->offer_no }} &nbsp;·&nbsp; {{ now()->format('d.m.Y') }}</div>
        </div>
    </div>

</div>
</body>
</html>
