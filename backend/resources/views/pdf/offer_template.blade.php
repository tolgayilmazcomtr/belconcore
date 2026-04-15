<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Teklif {{ $offer->offer_no }}</title>
    <style>
        /*
         * DomPDF uyumlu CSS — flexbox/grid KULLANILMAZ
         * Tüm layout: table, float, block
         */

        * { margin: 0; padding: 0; }

        html, body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 9pt;
            color: #1e293b;
            background: #fff;
        }

        /* ── Sayfa ──────────────────────────────────────────── */
        .page {
            width: 170mm;         /* 210mm - 2×20mm margin */
            margin: 14mm 20mm;
        }

        /* ── Header (table layout) ──────────────────────────── */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 7mm;
            padding-bottom: 5mm;
            border-bottom: 2pt solid #0f172a;
        }
        .header-table td { vertical-align: top; }
        .header-logo td { padding-bottom: 4mm; }

        .company-name  { font-size: 14pt; font-weight: 700; color: #0f172a; }
        .company-sub   { font-size: 7pt;  color: #64748b; letter-spacing: 0.06em; text-transform: uppercase; }
        .offer-badge   { font-size: 7pt;  font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase; }
        .offer-no-big  { font-size: 16pt; font-weight: 700; color: #0f172a; }
        .status-badge  { display: inline-block; font-size: 7pt; font-weight: 700; letter-spacing: 0.06em;
                         text-transform: uppercase; padding: 2px 7px; border-radius: 3px; margin-top: 3px; }
        .s-draft    { background: #f1f5f9; color: #475569; }
        .s-sent     { background: #dbeafe; color: #1d4ed8; }
        .s-accepted { background: #dcfce7; color: #15803d; }
        .s-rejected { background: #fee2e2; color: #b91c1c; }

        /* ── Info boxes (table, 2 col) ──────────────────────── */
        .info-table { width: 100%; border-collapse: separate; border-spacing: 4mm 0; margin-bottom: 6mm; }
        .info-box   { border: 1px solid #e2e8f0; padding: 4mm 5mm; width: 50%; vertical-align: top; }
        .info-box-title {
            font-size: 7pt; font-weight: 700; letter-spacing: 0.07em;
            text-transform: uppercase; color: #94a3b8;
            border-bottom: 1px solid #f1f5f9; padding-bottom: 3px; margin-bottom: 4px;
        }
        .info-row   { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
        .info-row td { font-size: 7.5pt; padding: 1px 0; vertical-align: top; }
        .lbl { color: #64748b; width: 68px; }
        .val { color: #1e293b; font-weight: 600; }

        /* ── Section title ──────────────────────────────────── */
        .section-title {
            font-size: 7pt; font-weight: 700; letter-spacing: 0.08em;
            text-transform: uppercase; color: #94a3b8;
            margin-top: 5mm; margin-bottom: 3mm;
        }

        /* ── Price table ────────────────────────────────────── */
        .price-table { width: 100%; border-collapse: collapse; }
        .price-table th {
            background: #0f172a; color: #fff;
            font-size: 7.5pt; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.05em;
            padding: 4pt 8pt; text-align: left;
        }
        .price-table th.r, .price-table td.r { text-align: right; }
        .price-table td {
            padding: 4.5pt 8pt; font-size: 8.5pt;
            color: #334155; border-bottom: 1px solid #f1f5f9;
        }
        .price-table tr.alt td { background: #f8fafc; }
        .price-table tr.total td {
            background: #f1f5f9; font-weight: 700;
            font-size: 9.5pt; color: #0f172a;
            border-top: 2px solid #e2e8f0; border-bottom: none;
        }
        .disc { color: #dc2626; }

        /* ── Validity bar (table) ─────────────────────────── */
        .validity-table {
            width: 100%; border-collapse: collapse;
            background: #f8fafc; border: 1px solid #e2e8f0;
            margin-top: 4mm; margin-bottom: 4mm;
        }
        .validity-table td { padding: 3mm 5mm; font-size: 8pt; vertical-align: middle; }
        .validity-table .vlbl { color: #64748b; }
        .validity-table .vval { font-weight: 700; text-align: right; }

        /* ── Text block ─────────────────────────────────────── */
        .text-block {
            border: 1px solid #e2e8f0;
            padding: 4mm 5mm;
            margin-bottom: 4mm;
            font-size: 8.5pt;
            color: #334155;
            line-height: 1.55;
        }

        /* ── Payment plan table ─────────────────────────────── */
        .pay-table { width: 100%; border-collapse: collapse; margin-bottom: 3mm; }
        .pay-table th {
            background: #1e3a5f; color: #fff;
            font-size: 7pt; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.04em;
            padding: 3pt 6pt; text-align: left;
        }
        .pay-table th.r, .pay-table td.r { text-align: right; }
        .pay-table td {
            padding: 3.5pt 6pt; font-size: 7.5pt;
            color: #334155; border-bottom: 1px solid #f1f5f9;
        }
        .pay-table tr.alt td { background: #f8fafc; }
        .pay-table tr.pay-total td {
            background: #e2e8f0; font-weight: 700;
            font-size: 8pt; color: #0f172a;
            border-top: 1.5px solid #94a3b8; border-bottom: none;
        }
        .pay-table .inf-badge { color: #d97706; font-size: 6.5pt; }
        .pay-inflation-note {
            font-size: 6.5pt; color: #78716c;
            border: 1px solid #fde68a; background: #fffbeb;
            padding: 2mm 3mm; margin-bottom: 3mm;
        }

        /* ── Signature (3 cols via table) ────────────────────── */
        .sig-table { width: 100%; border-collapse: separate; border-spacing: 6mm 0; margin-top: 8mm; }
        .sig-td { width: 33%; vertical-align: bottom; }
        .sig-line { border-top: 1px solid #cbd5e1; padding-top: 3px; margin-top: 12mm; }
        .sig-lbl  { font-size: 7pt; color: #64748b; }

        /* ── Footer (table) ──────────────────────────────────── */
        .footer-table {
            width: 100%; border-collapse: collapse;
            border-top: 1px solid #e2e8f0;
            margin-top: 8mm; padding-top: 4mm;
        }
        .footer-table td { padding-top: 3mm; font-size: 7pt; color: #94a3b8; line-height: 1.5; vertical-align: top; }
        .footer-brand { font-size: 7.5pt; font-weight: 700; color: #0f172a; margin-bottom: 1px; }
        .footer-right { text-align: right; }

        /* ── Logo img ────────────────────────────────────────── */
        .logo-img { max-height: 44px; max-width: 130px; }
    </style>
</head>
<body>
<div class="page">

    @php
        $project     = $offer->project;
        $companyName = ($project && $project->company_name) ? $project->company_name : ($project->name ?? 'Belcon');
        $logoPath    = ($project && $project->logo_path) ? storage_path('app/public/' . $project->logo_path) : null;
        $hasLogo     = $logoPath && file_exists($logoPath);

        $statusMap = [
            'draft'    => ['Taslak',       's-draft'],
            'sent'     => ['Gönderildi',   's-sent'],
            'accepted' => ['Kabul Edildi', 's-accepted'],
            'rejected' => ['Reddedildi',   's-rejected'],
        ];
        [$statusLabel, $statusClass] = $statusMap[$offer->status] ?? [$offer->status, 's-draft'];
    @endphp

    {{-- ══ HEADER ══════════════════════════════════════════════ --}}
    <table class="header-table">
        <tr>
            <td style="width:60%">
                @if($hasLogo)
                    <img src="{{ $logoPath }}" class="logo-img" alt="{{ $companyName }}">
                @else
                    <div class="company-name">{{ $companyName }}</div>
                    <div class="company-sub">Gayrimenkul &amp; İnşaat</div>
                @endif
            </td>
            <td style="width:40%; text-align:right; vertical-align:top;">
                <div class="offer-badge">Satış Teklifi</div>
                <div class="offer-no-big">{{ $offer->offer_no }}</div>
                <span class="status-badge {{ $statusClass }}">{{ $statusLabel }}</span>
            </td>
        </tr>
    </table>

    {{-- ══ INFO GRID ════════════════════════════════════════════ --}}
    <table class="info-table">
        <tr>
            <td class="info-box">
                <div class="info-box-title">Müşteri Bilgileri</div>
                @if($offer->customer)
                    @php
                        $c = $offer->customer;
                        $cName = $c->type === 'corporate' ? $c->company_name : "{$c->first_name} {$c->last_name}";
                    @endphp
                    <table class="info-row"><tr><td class="lbl">Ad / Unvan</td><td class="val">{{ $cName }}</td></tr></table>
                    @if($c->phone)<table class="info-row"><tr><td class="lbl">Telefon</td><td class="val">{{ $c->phone }}</td></tr></table>@endif
                    @if($c->email)<table class="info-row"><tr><td class="lbl">E-posta</td><td class="val">{{ $c->email }}</td></tr></table>@endif
                    @if($c->address)<table class="info-row"><tr><td class="lbl">Adres</td><td class="val">{{ $c->address }}{{ $c->city ? ', '.$c->city : '' }}</td></tr></table>@endif
                    @if($c->type === 'corporate' && $c->tax_number)<table class="info-row"><tr><td class="lbl">Vergi No</td><td class="val">{{ $c->tax_number }} / {{ $c->tax_office }}</td></tr></table>@endif
                @endif
            </td>
            <td class="info-box">
                <div class="info-box-title">Teklif Detayları</div>
                @if($offer->unit)
                    @php $u = $offer->unit; @endphp
                    <table class="info-row"><tr><td class="lbl">Konut</td><td class="val">{{ $u->block->name ?? '' }} Blok / No: {{ $u->unit_no }}</td></tr></table>
                    <table class="info-row"><tr><td class="lbl">Tip</td><td class="val">{{ $u->unit_type ?? '-' }}</td></tr></table>
                    @if($u->net_area)<table class="info-row"><tr><td class="lbl">Net Alan</td><td class="val">{{ $u->net_area }} m²</td></tr></table>@endif
                    @if($u->floor_no !== null)<table class="info-row"><tr><td class="lbl">Kat</td><td class="val">{{ $u->floor_no }}. Kat</td></tr></table>@endif
                @endif
                <table class="info-row"><tr><td class="lbl">Teklif Tarihi</td><td class="val">{{ $offer->created_at ? $offer->created_at->format('d.m.Y') : '-' }}</td></tr></table>
                @if($offer->creator)<table class="info-row"><tr><td class="lbl">Hazırlayan</td><td class="val">{{ $offer->creator->name }}</td></tr></table>@endif
            </td>
        </tr>
    </table>

    {{-- ══ FİYATLANDIRMA ════════════════════════════════════════ --}}
    <div class="section-title">Fiyatlandırma</div>
    <table class="price-table">
        <thead>
            <tr>
                <th style="width:60%">Açıklama</th>
                <th class="r" style="width:40%">Tutar</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Liste / Baz Satış Fiyatı</td>
                <td class="r">{{ number_format($offer->base_price, 0, ',', '.') }} ₺</td>
            </tr>
            @if($offer->discount_amount > 0)
            <tr class="alt">
                <td class="disc">Özel İndirim</td>
                <td class="r disc">- {{ number_format($offer->discount_amount, 0, ',', '.') }} ₺</td>
            </tr>
            @endif
            <tr class="total">
                <td>Net Teklif Fiyatı (KDV Hariç)</td>
                <td class="r">{{ number_format($offer->final_price, 0, ',', '.') }} ₺</td>
            </tr>
        </tbody>
    </table>

    {{-- ══ GEÇERLİLİK ════════════════════════════════════════════ --}}
    @if($offer->valid_until)
    <table class="validity-table">
        <tr>
            <td class="vlbl">Bu teklif aşağıdaki tarihe kadar geçerlidir:</td>
            <td class="vval">{{ \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') }}</td>
        </tr>
    </table>
    @endif

    {{-- ══ ÖDEME PLANI ════════════════════════════════════════════ --}}
    @if($offer->payment_plan)
    @php
        $planData = null;
        $decoded = json_decode($offer->payment_plan, true);
        if (is_array($decoded) && isset($decoded['items']) && count($decoded['items']) > 0) {
            $planData = $decoded;
        }
        $typeLabels = [
            'downpayment_only'   => 'Tam Peşin',
            'lump_sum'           => 'Tek Seferlik',
            'equal_installments' => 'Eşit Taksitli',
            'fixed_amount'       => 'Sabit Tutarlı',
            'custom'             => 'Özel Plan',
        ];
    @endphp

    <div class="section-title">Ödeme Planı</div>

    @if($planData)
        @php
            $annualRate = round((pow(1 + $planData['monthly_inflation_rate'] / 100, 12) - 1) * 100, 1);
            $typeLabel  = $typeLabels[$planData['type']] ?? $planData['type'];
        @endphp
        <div class="pay-inflation-note">
            Plan Tipi: <strong>{{ $typeLabel }}</strong> &nbsp;|&nbsp;
            Aylık Enflasyon: <strong>%{{ $planData['monthly_inflation_rate'] }}</strong> &nbsp;|&nbsp;
            Yıllık: <strong>~%{{ $annualRate }}</strong> &nbsp;|&nbsp;
            Teklif Tarihi: <strong>{{ \Carbon\Carbon::parse($planData['offer_date'])->format('d.m.Y') }}</strong>
        </div>
        <table class="pay-table">
            <thead>
                <tr>
                    <th style="width:5%">#</th>
                    <th style="width:28%">Açıklama</th>
                    <th style="width:20%">Ödeme Tarihi</th>
                    <th class="r" style="width:22%">Bugünkü Değer</th>
                    <th class="r" style="width:25%">Ödenecek Tutar</th>
                </tr>
            </thead>
            <tbody>
                @foreach($planData['items'] as $idx => $item)
                <tr class="{{ $idx % 2 === 1 ? 'alt' : '' }}">
                    <td>{{ $item['no'] }}</td>
                    <td><strong>{{ $item['description'] }}</strong></td>
                    <td>{{ $item['date'] }}</td>
                    <td class="r">{{ number_format($item['real_amount'], 0, ',', '.') }} ₺</td>
                    <td class="r">
                        <strong>{{ number_format($item['nominal_amount'], 0, ',', '.') }} ₺</strong>
                        @if($item['month_offset'] > 0)
                            @php $pct = round(($item['nominal_amount'] / max($item['real_amount'], 1) - 1) * 100, 1); @endphp
                            <span class="inf-badge"> (+%{{ $pct }})</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="pay-total">
                    <td colspan="3">TOPLAM</td>
                    <td class="r">{{ number_format($planData['total_real'], 0, ',', '.') }} ₺</td>
                    <td class="r">{{ number_format($planData['total_nominal'], 0, ',', '.') }} ₺</td>
                </tr>
            </tfoot>
        </table>
    @else
        <div class="text-block">{{ $offer->payment_plan }}</div>
    @endif
    @endif

    {{-- ══ NOTLAR ══════════════════════════════════════════════ --}}
    @if($offer->notes)
    <div class="section-title">Notlar ve Özel Koşullar</div>
    <div class="text-block">{{ $offer->notes }}</div>
    @endif

    {{-- ══ İMZA ════════════════════════════════════════════════ --}}
    <table class="sig-table">
        <tr>
            <td class="sig-td">
                <div class="sig-line"><span class="sig-lbl">Müşteri Adı Soyadı / İmza</span></div>
            </td>
            <td class="sig-td">
                <div class="sig-line"><span class="sig-lbl">Yetkili Temsilci / İmza</span></div>
            </td>
            <td class="sig-td">
                <div class="sig-line"><span class="sig-lbl">Tarih</span></div>
            </td>
        </tr>
    </table>

    {{-- ══ FOOTER ══════════════════════════════════════════════════ --}}
    <table class="footer-table">
        <tr>
            <td style="width:60%">
                @if($offer->project)
                    @php $p = $offer->project; @endphp
                    <div class="footer-brand">{{ $p->company_name ?? $p->name }}</div>
                    @if($p->company_address)<div>{{ $p->company_address }}</div>@endif
                    @if($p->company_phone)<div>Tel: {{ $p->company_phone }}@if($p->company_email) &nbsp;|&nbsp; {{ $p->company_email }}@endif</div>@endif
                    @if($p->tax_number)<div>VKN: {{ $p->tax_number }} / {{ $p->tax_office }}</div>@endif
                @endif
            </td>
            <td class="footer-right">
                <div>Bu belge elektronik ortamda oluşturulmuştur.</div>
                <div>{{ $offer->offer_no }} &nbsp;&middot;&nbsp; {{ now()->format('d.m.Y') }}</div>
            </td>
        </tr>
    </table>

</div>
</body>
</html>
