<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Satis Teklifi {{ $offer->offer_no }}</title>
    <style>
        /*
         * DomPDF v3 — table/block layout, no flex/grid
         * Font : DejaVu Sans (full Turkish / Unicode support)
         * Palette:
         *   #C8102E  Belcon Red   — sadece kritik vurgu noktalari
         *   #111827  Ink          — basliklar ve guclu metin
         *   #374151  Body         — normal metin
         *   #6B7280  Muted        — etiketler
         *   #F9FAFB  Surface      — hafif arkaplan
         *   #E5E7EB  Border       — cizgiler
         */

        * { margin:0; padding:0; }

        html, body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 8.5pt;
            color: #374151;
            background: #ffffff;
            line-height: 1.5;
        }

        .page {
            width: 170mm;
            margin: 15mm 20mm;
        }

        /* ─── HEADER ─────────────────────────────────────────── */
        .hdr { width:100%; border-collapse:collapse; margin-bottom:7mm; }
        .hdr td { vertical-align:middle; padding:0; }
        .hdr-left  { width:55%; }
        .hdr-right { width:45%; text-align:right; vertical-align:top; }

        .co-name    { font-size:13pt; font-weight:700; color:#111827; letter-spacing:-0.2px; }
        .co-sub     { font-size:6.5pt; color:#C8102E; font-weight:700;
                      letter-spacing:0.12em; text-transform:uppercase; margin-top:2px; }
        .logo-img   { max-height:42px; max-width:130px; }

        .doc-label  { font-size:6.5pt; font-weight:700; color:#6B7280;
                      letter-spacing:0.12em; text-transform:uppercase; }
        .doc-no     { font-size:13pt; font-weight:700; color:#111827; margin:2px 0; }
        .s-badge    { display:inline-block; font-size:6.5pt; font-weight:700;
                      letter-spacing:0.06em; text-transform:uppercase;
                      padding:2px 7px; border:1px solid; }
        .s-draft    { color:#6B7280; border-color:#D1D5DB; background:#F9FAFB; }
        .s-sent     { color:#1D4ED8; border-color:#BFDBFE; background:#EFF6FF; }
        .s-accepted { color:#166534; border-color:#BBF7D0; background:#F0FDF4; }
        .s-rejected { color:#991B1B; border-color:#FECACA; background:#FFF5F5; }

        /* Kirmizi ayirici cizgi — header altinda */
        .hdr-rule { border:none; border-top:2.5px solid #C8102E; margin-bottom:6mm; }

        /* ─── İKİ SÜTUN BİLGİ ALANI ─────────────────────────── */
        .meta-tbl  { width:100%; border-collapse:collapse; margin-bottom:6mm; }
        .meta-tbl td { vertical-align:top; padding:0; }
        .meta-left  { width:52%; padding-right:8mm; }
        .meta-right { width:48%; }

        .meta-section { font-size:6pt; font-weight:700; color:#6B7280;
                        letter-spacing:0.12em; text-transform:uppercase;
                        margin-bottom:3px; }
        .meta-row   { width:100%; border-collapse:collapse; margin-bottom:1px; }
        .meta-row td{ font-size:7.5pt; padding:1px 0; vertical-align:top; }
        .ml { color:#6B7280; width:66px; }
        .mv { color:#111827; font-weight:600; }

        /* ─── BÖLÜM BAŞLIĞI ──────────────────────────────────── */
        .sh {
            font-size:6.5pt; font-weight:700; color:#6B7280;
            letter-spacing:0.12em; text-transform:uppercase;
            border-bottom:1px solid #E5E7EB;
            padding-bottom:2px; margin-bottom:3mm; margin-top:5mm;
        }

        /* ─── FİYAT TABLOSU ──────────────────────────────────── */
        .pt { width:100%; border-collapse:collapse; }
        .pt th {
            background:#111827; color:#fff;
            font-size:7pt; font-weight:600; text-transform:uppercase;
            letter-spacing:0.05em; padding:4pt 8pt; text-align:left;
        }
        .pt th.r { text-align:right; }
        .pt td { padding:4.5pt 8pt; font-size:8.5pt; color:#374151;
                 border-bottom:1px solid #F3F4F6; }
        .pt td.r { text-align:right; }
        .pt tr.stripe td { background:#F9FAFB; }
        .pt tr.tot td {
            padding:5pt 8pt;
            font-weight:700; font-size:9.5pt; color:#C8102E;
            border-top:1.5px solid #E5E7EB; border-bottom:none;
            background:#fff;
        }
        .pt tr.tot td.r { text-align:right; }
        .disc { color:#991B1B; }

        /* ─── GEÇERLİLİK SATIRI ─────────────────────────────── */
        .val-row { width:100%; border-collapse:collapse;
                   border-top:1px solid #E5E7EB; margin-top:3mm; margin-bottom:4mm; }
        .val-row td { padding:3mm 0; font-size:8pt; vertical-align:middle; }
        .val-lbl  { color:#6B7280; }
        .val-date { font-weight:700; color:#C8102E; text-align:right; font-size:9pt; }

        /* ─── ÖDEME PLANI META NOTU ──────────────────────────── */
        .plan-note {
            font-size:7pt; color:#6B7280;
            border-top:1px solid #E5E7EB; border-bottom:1px solid #E5E7EB;
            padding:2mm 0; margin-bottom:3mm;
        }

        /* ─── ÖDEME PLANI TABLOSU ────────────────────────────── */
        .ot { width:100%; border-collapse:collapse; }
        .ot th {
            background:#1F2937; color:#fff;
            font-size:6.5pt; font-weight:700; text-transform:uppercase;
            letter-spacing:0.05em; padding:3.5pt 7pt; text-align:left;
        }
        .ot th.r { text-align:right; }
        .ot td { padding:3.5pt 7pt; font-size:7.5pt; color:#374151;
                 border-bottom:1px solid #F3F4F6; }
        .ot td.r { text-align:right; }
        .ot tr.stripe td { background:#F9FAFB; }
        .ot tfoot td {
            background:#F9FAFB; font-weight:700; font-size:8pt; color:#111827;
            border-top:1.5px solid #E5E7EB; padding:4pt 7pt;
        }
        .ot tfoot td.r { text-align:right; }
        .inf-pct { font-size:6pt; color:#D97706; }

        /* ─── DÜZMETN BLOĞU ──────────────────────────────────── */
        .txt { font-size:8pt; color:#374151; line-height:1.6;
               border-left:2px solid #E5E7EB; padding-left:4mm; margin-bottom:3mm; }

        /* ─── YASAL UYARI ────────────────────────────────────── */
        .legal {
            font-size:6.5pt; color:#9CA3AF; line-height:1.55;
            border-top:1px solid #F3F4F6; padding-top:3mm; margin-top:4mm;
        }

        /* ─── İMZA ALANI ─────────────────────────────────────── */
        .sig-tbl { width:100%; border-collapse:separate; border-spacing:6mm 0; margin-top:8mm; }
        .sig-td  { width:33%; vertical-align:bottom; }
        .sig-line{ border-top:1px solid #D1D5DB; padding-top:3px; margin-top:14mm; }
        .sig-name { font-size:7.5pt; font-weight:600; color:#374151; }
        .sig-role { font-size:6.5pt; color:#9CA3AF; margin-top:1px; }

        /* ─── FOOTER ─────────────────────────────────────────── */
        .footer-tbl {
            width:100%; border-collapse:collapse;
            border-top:1px solid #E5E7EB; margin-top:8mm;
        }
        .footer-tbl td { padding-top:3mm; font-size:6.5pt; color:#9CA3AF;
                         line-height:1.55; vertical-align:top; }
        .f-brand { font-size:7pt; font-weight:700; color:#111827; margin-bottom:1px; }
        .f-right { text-align:right; }
        .f-docno { color:#C8102E; font-weight:700; font-size:6.5pt; }
    </style>
</head>
<body>
<div class="page">

@php
    $project     = $offer->project;
    $companyName = ($project && $project->company_name) ? $project->company_name : ($project->name ?? 'Belcon');
    $logoPath    = ($project && $project->logo_path) ? storage_path('app/public/' . $project->logo_path) : null;
    $hasLogo     = $logoPath && file_exists($logoPath);
    $statusMap   = [
        'draft'    => ['Taslak',       's-draft'],
        'sent'     => ['Gonderildi',   's-sent'],
        'accepted' => ['Kabul Edildi', 's-accepted'],
        'rejected' => ['Reddedildi',   's-rejected'],
    ];
    [$statusLabel, $statusClass] = $statusMap[$offer->status] ?? [$offer->status, 's-draft'];
@endphp

{{-- HEADER --}}
<table class="hdr">
    <tr>
        <td class="hdr-left">
            @if($hasLogo)
                <img src="{{ $logoPath }}" class="logo-img" alt="{{ $companyName }}">
            @else
                <div class="co-name">{{ $companyName }}</div>
                <div class="co-sub">Gayrimenkul &amp; Insaat</div>
            @endif
        </td>
        <td class="hdr-right">
            <div class="doc-label">Satis Teklifi</div>
            <div class="doc-no">{{ $offer->offer_no }}</div>
            <span class="s-badge {{ $statusClass }}">{{ $statusLabel }}</span>
        </td>
    </tr>
</table>
<hr class="hdr-rule">

{{-- META: müşteri + teklif detayı --}}
@php
    $c     = $offer->customer;
    $cName = $c ? ($c->type === 'corporate' ? $c->company_name : trim("{$c->first_name} {$c->last_name}")) : null;
    $u     = $offer->unit;
@endphp
<table class="meta-tbl">
    <tr>
        {{-- Sol: Müşteri --}}
        <td class="meta-left">
            <div class="meta-section">Musteri</div>
            @if($cName)
            <table class="meta-row"><tr><td class="ml">Ad / Unvan</td><td class="mv">{{ $cName }}</td></tr></table>
            @endif
            @if($c && $c->phone)
            <table class="meta-row"><tr><td class="ml">Telefon</td><td class="mv">{{ $c->phone }}</td></tr></table>
            @endif
            @if($c && $c->email)
            <table class="meta-row"><tr><td class="ml">E-posta</td><td class="mv">{{ $c->email }}</td></tr></table>
            @endif
            @if($c && $c->address)
            <table class="meta-row"><tr><td class="ml">Adres</td><td class="mv">{{ $c->address }}{{ $c->city ? ', '.$c->city : '' }}</td></tr></table>
            @endif
            @if($c && $c->type === 'corporate' && $c->tax_number)
            <table class="meta-row"><tr><td class="ml">Vergi No</td><td class="mv">{{ $c->tax_number }}@if($c->tax_office) / {{ $c->tax_office }}@endif</td></tr></table>
            @endif
        </td>

        {{-- Sağ: Teklif & Gayrimenkul --}}
        <td class="meta-right">
            <div class="meta-section">Teklif &amp; Gayrimenkul</div>
            @if($u)
            <table class="meta-row"><tr><td class="ml">Konut</td><td class="mv">{{ $u->block->name ?? '' }} Blok — No: {{ $u->unit_no }}</td></tr></table>
            @if($u->unit_type)
            <table class="meta-row"><tr><td class="ml">Tip</td><td class="mv">{{ $u->unit_type }}</td></tr></table>
            @endif
            @if($u->net_area)
            <table class="meta-row"><tr><td class="ml">Alan</td><td class="mv">{{ $u->net_area }} m2 net@if($u->gross_area) / {{ $u->gross_area }} m2 brut@endif</td></tr></table>
            @endif
            @if($u->floor_no !== null)
            <table class="meta-row"><tr><td class="ml">Kat</td><td class="mv">{{ $u->floor_no }}. Kat</td></tr></table>
            @endif
            @endif
            <table class="meta-row"><tr><td class="ml">Teklif Tarihi</td><td class="mv">{{ $offer->created_at ? $offer->created_at->format('d.m.Y') : now()->format('d.m.Y') }}</td></tr></table>
            @if($offer->creator)
            <table class="meta-row"><tr><td class="ml">Hazirlayan</td><td class="mv">{{ $offer->creator->name }}</td></tr></table>
            @endif
        </td>
    </tr>
</table>

{{-- FİYATLANDIRMA --}}
<div class="sh">Fiyatlandirma</div>
<table class="pt">
    <thead>
        <tr>
            <th style="width:65%">Aciklama</th>
            <th class="r" style="width:35%">Tutar</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Liste / Baz Satis Fiyati</td>
            <td class="r">{{ number_format($offer->base_price, 0, ',', '.') }} TL</td>
        </tr>
        @if($offer->discount_amount > 0)
        <tr class="stripe">
            <td class="disc">Ozel Indirim</td>
            <td class="r disc">- {{ number_format($offer->discount_amount, 0, ',', '.') }} TL</td>
        </tr>
        @endif
        <tr class="tot">
            <td>Net Teklif Fiyati</td>
            <td class="r">{{ number_format($offer->final_price, 0, ',', '.') }} TL</td>
        </tr>
    </tbody>
</table>

{{-- GEÇERLİLİK --}}
@if($offer->valid_until)
<table class="val-row">
    <tr>
        <td class="val-lbl">Teklifin gecerlilik tarihi:</td>
        <td class="val-date">{{ \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') }}</td>
    </tr>
</table>
@endif

{{-- ÖDEME PLANI --}}
@if($offer->payment_plan)
@php
    $planData  = null;
    $decoded   = json_decode($offer->payment_plan, true);
    if (is_array($decoded) && !empty($decoded['items'])) $planData = $decoded;
    $typeLabels = [
        'downpayment_only'   => 'Tam Pesin',
        'lump_sum'           => 'Tek Seferlik',
        'equal_installments' => 'Esit Taksit',
        'fixed_amount'       => 'Sabit Tutar',
        'custom'             => 'Ozel Plan',
    ];
@endphp

<div class="sh">Odeme Plani</div>

@if($planData)
    @php
        $annualRate = round((pow(1 + $planData['monthly_inflation_rate'] / 100, 12) - 1) * 100, 1);
        $typeLabel  = $typeLabels[$planData['type']] ?? '-';
    @endphp
    <div class="plan-note">
        Plan: <strong>{{ $typeLabel }}</strong>
        &nbsp;&middot;&nbsp;
        Aylik enflasyon: <strong>%{{ $planData['monthly_inflation_rate'] }}</strong>
        (Yillik ~%{{ $annualRate }})
        &nbsp;&middot;&nbsp;
        Baz tarih: {{ \Carbon\Carbon::parse($planData['offer_date'])->format('d.m.Y') }}
    </div>
    <table class="ot">
        <thead>
            <tr>
                <th style="width:5%">#</th>
                <th style="width:30%">Aciklama</th>
                <th style="width:20%">Odeme Tarihi</th>
                <th class="r" style="width:22%">Bugunun Degeri</th>
                <th class="r" style="width:23%">Odenecek Tutar</th>
            </tr>
        </thead>
        <tbody>
            @foreach($planData['items'] as $idx => $item)
            <tr class="{{ $idx % 2 === 1 ? 'stripe' : '' }}">
                <td style="color:#9CA3AF;">{{ $item['no'] }}</td>
                <td><strong>{{ $item['description'] }}</strong></td>
                <td>{{ $item['date'] }}</td>
                <td class="r" style="color:#9CA3AF;">{{ number_format($item['real_amount'], 0, ',', '.') }} TL</td>
                <td class="r">
                    <strong>{{ number_format($item['nominal_amount'], 0, ',', '.') }} TL</strong>
                    @if($item['month_offset'] > 0)
                        @php $pct = round(($item['nominal_amount'] / max($item['real_amount'],1) - 1) * 100, 1); @endphp
                        <span class="inf-pct">&nbsp;(+%{{ $pct }})</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">Toplam</td>
                <td class="r" style="color:#6B7280;font-size:7pt;">{{ number_format($planData['total_real'], 0, ',', '.') }} TL</td>
                <td class="r">{{ number_format($planData['total_nominal'], 0, ',', '.') }} TL</td>
            </tr>
        </tfoot>
    </table>
@else
    <div class="txt">{{ $offer->payment_plan }}</div>
@endif
@endif

{{-- NOTLAR --}}
@if($offer->notes)
<div class="sh">Ozel Notlar</div>
<div class="txt">{{ $offer->notes }}</div>
@endif

{{-- YASAL UYARI --}}
<div class="legal">
    Bu belge bilgilendirme amacli olup hukuki baglayicilik tasimaz. Teklif; gecerlilik suresi icinde taraflarca
    imzalanmis satış sözlesmesi ile kesinlesir. Fiyatlar KDV haric Turk Lirasi cinsindendir.
    Sirket, onceden bildirimde bulunmaksizin kosulları degistirme hakkını saklı tutar.
</div>

{{-- İMZA --}}
<table class="sig-tbl">
    <tr>
        <td class="sig-td">
            <div class="sig-line">
                <div class="sig-name">Musteri</div>
                <div class="sig-role">Ad Soyad / Imza</div>
            </div>
        </td>
        <td class="sig-td">
            <div class="sig-line">
                <div class="sig-name">Yetkili Temsilci</div>
                <div class="sig-role">Ad Soyad / Imza / Kase</div>
            </div>
        </td>
        <td class="sig-td">
            <div class="sig-line">
                <div class="sig-name">Tarih</div>
                <div class="sig-role">GG / AA / YYYY</div>
            </div>
        </td>
    </tr>
</table>

{{-- FOOTER --}}
<table class="footer-tbl">
    <tr>
        <td style="width:58%">
            @if($offer->project)
                @php $p = $offer->project; @endphp
                <div class="f-brand">{{ $p->company_name ?? $p->name }}</div>
                @if($p->company_address)<div>{{ $p->company_address }}</div>@endif
                @if($p->company_phone)<div>Tel: {{ $p->company_phone }}@if($p->company_email) &nbsp;|&nbsp; {{ $p->company_email }}@endif</div>@endif
                @if($p->tax_number)<div>VKN: {{ $p->tax_number }}@if($p->tax_office) / {{ $p->tax_office }}@endif</div>@endif
            @endif
        </td>
        <td class="f-right" style="width:42%">
            <div class="f-docno">{{ $offer->offer_no }}</div>
            <div>{{ now()->format('d.m.Y H:i') }}</div>
            <div>Bu belge elektronik olarak uretilmistir.</div>
        </td>
    </tr>
</table>

</div>
</body>
</html>
