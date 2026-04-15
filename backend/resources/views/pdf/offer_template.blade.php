<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>Teklif</title>
<style>
* { margin:0; padding:0; }

html, body {
    font-family: 'DejaVu Sans', sans-serif;
    font-size: 8.5pt;
    color: #1a1a1a;
    background: #fff;
    line-height: 1.45;
}

.page {
    width: 170mm;
    margin: 12mm 20mm 12mm 20mm;
}

/* ── HEADER ─────────────────────────────── */
.hdr { width:100%; border-collapse:collapse; }
.hdr td { vertical-align:middle; padding:0; }
.logo-img { max-height:40px; max-width:120px; }
.co-name { font-size:14pt; font-weight:700; color:#111; letter-spacing:-0.3px; }
.co-sub  { font-size:6pt; font-weight:700; color:#C8102E; letter-spacing:0.14em; text-transform:uppercase; margin-top:1px; }
.doc-meta { text-align:right; vertical-align:top; }
.doc-lbl  { font-size:6pt; font-weight:700; color:#999; letter-spacing:0.14em; text-transform:uppercase; }
.doc-no   { font-size:12.5pt; font-weight:700; color:#111; margin:2px 0 3px; }

.s-badge {
    display:inline-block; font-size:6pt; font-weight:700;
    letter-spacing:0.08em; text-transform:uppercase;
    padding:2px 8px; border:1px solid;
}
.s-draft    { color:#666; border-color:#ccc; background:#f5f5f5; }
.s-sent     { color:#1a56db; border-color:#a4cafe; background:#ebf5ff; }
.s-accepted { color:#057a55; border-color:#84e1bc; background:#f3faf7; }
.s-rejected { color:#c81e1e; border-color:#f8b4b4; background:#fdf2f2; }

/* Kirmizi ayrac */
.rule-red { border:none; border-top:2px solid #C8102E; margin:5mm 0 5mm; }

/* ── META (2 SUTUN) ─────────────────────── */
.meta { width:100%; border-collapse:collapse; margin-bottom:5mm; }
.meta td { vertical-align:top; padding:0; }
.meta-l { width:50%; padding-right:7mm; }
.meta-r { width:50%; }

.sec-label {
    font-size:6pt; font-weight:700; color:#999;
    letter-spacing:0.14em; text-transform:uppercase;
    margin-bottom:3px;
}
.kv { width:100%; border-collapse:collapse; }
.kv td { font-size:7.5pt; padding:1.2px 0; vertical-align:top; }
.k { color:#777; width:64px; }
.v { color:#111; font-weight:600; }

/* Bolum ayrac */
.sh {
    font-size:6pt; font-weight:700; color:#999;
    letter-spacing:0.14em; text-transform:uppercase;
    border-bottom:1px solid #e0e0e0;
    padding-bottom:2px; margin-top:4.5mm; margin-bottom:2.5mm;
}

/* ── FİYAT TABLOSU ──────────────────────── */
.pt { width:100%; border-collapse:collapse; }
.pt th {
    background:#111; color:#fff;
    font-size:6.5pt; font-weight:700; text-transform:uppercase;
    letter-spacing:0.07em; padding:4pt 8pt; text-align:left;
}
.pt th.r { text-align:right; }
.pt td   { padding:4pt 8pt; font-size:8pt; color:#333; border-bottom:1px solid #f0f0f0; }
.pt td.r { text-align:right; }
.pt .s2 td { background:#fafafa; }
.pt .tot td {
    padding:4.5pt 8pt; font-size:9pt; font-weight:700;
    color:#C8102E; border-top:1.5px solid #ddd; border-bottom:none; background:#fff;
}
.pt .tot td.r { text-align:right; }
.disc { color:#c81e1e; }

/* ── GEÇERLİLİK ─────────────────────────── */
.val-row { width:100%; border-collapse:collapse; margin-top:2.5mm; margin-bottom:2mm; }
.val-row td { padding:2.5mm 0; font-size:8pt; border-top:1px solid #f0f0f0; border-bottom:1px solid #f0f0f0; }
.val-lbl  { color:#777; }
.val-date { text-align:right; font-weight:700; color:#C8102E; font-size:8.5pt; }

/* ── ÖDEME PLANI META ────────────────────── */
.plan-meta {
    font-size:6.5pt; color:#777;
    padding:2mm 0; margin-bottom:2.5mm;
    border-bottom:1px solid #f0f0f0;
}

/* ── ÖDEME PLANI TABLOSU ─────────────────── */
.ot { width:100%; border-collapse:collapse; }
.ot th {
    background:#1f2937; color:#fff;
    font-size:6pt; font-weight:700; text-transform:uppercase;
    letter-spacing:0.06em; padding:3.5pt 7pt; text-align:left;
}
.ot th.r { text-align:right; }
.ot td   { padding:3pt 7pt; font-size:7.5pt; color:#333; border-bottom:1px solid #f0f0f0; }
.ot td.r { text-align:right; }
.ot .s2 td { background:#fafafa; }
.ot tfoot td {
    background:#f5f5f5; font-weight:700; font-size:7.5pt;
    color:#111; border-top:1.5px solid #ddd; padding:3.5pt 7pt;
}
.ot tfoot td.r { text-align:right; }
.inf { font-size:5.5pt; color:#b45309; }

/* ── DÜZYAZI BLOK ────────────────────────── */
.txt {
    font-size:7.5pt; color:#444; line-height:1.6;
    border-left:2px solid #ddd; padding-left:3.5mm; margin-bottom:2.5mm;
}

/* ── YASAL UYARI ─────────────────────────── */
.legal {
    font-size:6pt; color:#aaa; line-height:1.55;
    border-top:1px solid #f0f0f0; padding-top:2.5mm; margin-top:3.5mm;
}

/* ── İMZA ────────────────────────────────── */
.sig { width:100%; border-collapse:separate; border-spacing:5mm 0; margin-top:7mm; }
.sig td { width:33%; vertical-align:bottom; }
.sig-line { border-top:1px solid #ccc; padding-top:3px; margin-top:13mm; }
.sig-name { font-size:7pt; font-weight:700; color:#333; }
.sig-role { font-size:6pt; color:#aaa; margin-top:1px; }

/* ── FOOTER ──────────────────────────────── */
.footer { width:100%; border-collapse:collapse; border-top:1px solid #e0e0e0; margin-top:6mm; }
.footer td { padding-top:2.5mm; font-size:6pt; color:#aaa; line-height:1.6; vertical-align:top; }
.f-brand { font-size:6.5pt; font-weight:700; color:#111; margin-bottom:1px; }
.f-r { text-align:right; }
.f-no { color:#C8102E; font-weight:700; }
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
        'draft'    => ['TASLAK',       's-draft'],
        'sent'     => ['GONDERILDI',   's-sent'],
        'accepted' => ['KABUL EDILDI', 's-accepted'],
        'rejected' => ['REDDEDILDI',   's-rejected'],
    ];
    [$sLabel, $sClass] = $statusMap[$offer->status] ?? [$offer->status, 's-draft'];
    $c  = $offer->customer;
    $u  = $offer->unit;
    $cName = null;
    if ($c) {
        $cName = $c->type === 'corporate'
            ? $c->company_name
            : trim($c->first_name . ' ' . $c->last_name);
    }
@endphp

{{-- HEADER --}}
<table class="hdr">
    <tr>
        <td style="width:55%">
            @if($hasLogo)
                <img src="{{ $logoPath }}" class="logo-img" alt="{{ $companyName }}">
            @else
                <div class="co-name">{{ $companyName }}</div>
                <div class="co-sub">Gayrimenkul &amp; Insaat</div>
            @endif
        </td>
        <td class="doc-meta" style="width:45%">
            <div class="doc-lbl">Satis Teklifi</div>
            <div class="doc-no">{{ $offer->offer_no }}</div>
            <span class="s-badge {{ $sClass }}">{{ $sLabel }}</span>
        </td>
    </tr>
</table>
<hr class="rule-red">

{{-- META --}}
<table class="meta">
    <tr>
        <td class="meta-l">
            <div class="sec-label">Musteri</div>
            @if($cName)
                <table class="kv"><tr><td class="k">Ad / Unvan</td><td class="v">{{ $cName }}</td></tr></table>
            @endif
            @if($c && $c->phone)
                <table class="kv"><tr><td class="k">Telefon</td><td class="v">{{ $c->phone }}</td></tr></table>
            @endif
            @if($c && $c->email)
                <table class="kv"><tr><td class="k">E-posta</td><td class="v">{{ $c->email }}</td></tr></table>
            @endif
            @if($c && $c->address)
                <table class="kv"><tr><td class="k">Adres</td><td class="v">{{ $c->address }}{{ $c->city ? ', ' . $c->city : '' }}</td></tr></table>
            @endif
            @if($c && $c->type === 'corporate' && $c->tax_number)
                <table class="kv"><tr><td class="k">Vergi No</td><td class="v">{{ $c->tax_number }}{{ $c->tax_office ? ' / ' . $c->tax_office : '' }}</td></tr></table>
            @endif
        </td>
        <td class="meta-r">
            <div class="sec-label">Teklif &amp; Gayrimenkul</div>
            @if($u)
                @php
                    $blockName = $u->block->name ?? '';
                    $unitLabel = ($blockName ? $blockName . ' Blok — ' : '') . 'No: ' . $u->unit_no;
                    $alanStr   = '';
                    if ($u->net_area)   $alanStr .= $u->net_area . ' m2 net';
                    if ($u->gross_area) $alanStr .= ($alanStr ? ' / ' : '') . $u->gross_area . ' m2 brut';
                    $katStr = ($u->floor_no !== null && $u->floor_no !== '') ? $u->floor_no . '. Kat' : null;
                @endphp
                <table class="kv"><tr><td class="k">Konut</td><td class="v">{{ $unitLabel }}</td></tr></table>
                @if($u->unit_type)
                    <table class="kv"><tr><td class="k">Tip</td><td class="v">{{ $u->unit_type }}</td></tr></table>
                @endif
                @if($alanStr)
                    <table class="kv"><tr><td class="k">Alan</td><td class="v">{{ $alanStr }}</td></tr></table>
                @endif
                @if($katStr)
                    <table class="kv"><tr><td class="k">Kat</td><td class="v">{{ $katStr }}</td></tr></table>
                @endif
            @endif
            <table class="kv"><tr><td class="k">Teklif Tarihi</td><td class="v">{{ $offer->created_at ? $offer->created_at->format('d.m.Y') : now()->format('d.m.Y') }}</td></tr></table>
            @if($offer->creator)
                <table class="kv"><tr><td class="k">Hazirlayan</td><td class="v">{{ $offer->creator->name }}</td></tr></table>
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
        <tr class="s2">
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

@if($offer->valid_until)
<table class="val-row">
    <tr>
        <td class="val-lbl">Teklifin gecerlilik tarihi</td>
        <td class="val-date">{{ \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') }}</td>
    </tr>
</table>
@endif

{{-- ÖDEME PLANI --}}
@if($offer->payment_plan)
@php
    $planData  = null;
    $decoded   = json_decode($offer->payment_plan, true);
    if (is_array($decoded) && !empty($decoded['items'])) {
        $planData = $decoded;
    }
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
        $tLabel     = $typeLabels[$planData['type']] ?? '-';
    @endphp
    <div class="plan-meta">
        Plan: <strong>{{ $tLabel }}</strong>
        &nbsp;&middot;&nbsp; Aylik enflasyon: <strong>%{{ $planData['monthly_inflation_rate'] }}</strong> (Yillik ~%{{ $annualRate }})
        &nbsp;&middot;&nbsp; Baz tarih: {{ \Carbon\Carbon::parse($planData['offer_date'])->format('d.m.Y') }}
    </div>
    <table class="ot">
        <thead>
            <tr>
                <th style="width:6%">#</th>
                <th style="width:30%">Aciklama</th>
                <th style="width:20%">Odeme Tarihi</th>
                <th class="r" style="width:21%">Bugunun Degeri</th>
                <th class="r" style="width:23%">Odenecek Tutar</th>
            </tr>
        </thead>
        <tbody>
            @foreach($planData['items'] as $idx => $item)
            <tr class="{{ $idx % 2 === 1 ? 's2' : '' }}">
                <td style="color:#bbb;">{{ $item['no'] }}</td>
                <td><strong>{{ $item['description'] }}</strong></td>
                <td>{{ $item['date'] }}</td>
                <td class="r" style="color:#aaa;">{{ number_format($item['real_amount'], 0, ',', '.') }} TL</td>
                <td class="r">
                    <strong>{{ number_format($item['nominal_amount'], 0, ',', '.') }} TL</strong>
                    @if($item['month_offset'] > 0)
                        @php $pct = round(($item['nominal_amount'] / max($item['real_amount'], 1) - 1) * 100, 1); @endphp
                        <span class="inf"> +%{{ $pct }}</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">Toplam</td>
                <td class="r" style="color:#888;font-size:7pt;">{{ number_format($planData['total_real'], 0, ',', '.') }} TL</td>
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
<div class="sh">Notlar</div>
<div class="txt">{{ $offer->notes }}</div>
@endif

{{-- YASAL --}}
<div class="legal">
    Bu belge bilgilendirme amacli olup hukuki baglayicilik tasimaz.
    Satis; gecerlilik suresi icinde taraflarca imzalanmis satis sozlesmesi ile kesinlesir.
    Fiyatlar KDV haric Turk Lirasi cinsindendir.
    Sirket, onceden bildirimde bulunmaksizin teklif kosullarini degistirme hakkini sakli tutar.
</div>

{{-- İMZA --}}
<table class="sig">
    <tr>
        <td>
            <div class="sig-line">
                <div class="sig-name">Musteri</div>
                <div class="sig-role">Ad Soyad / Imza</div>
            </div>
        </td>
        <td>
            <div class="sig-line">
                <div class="sig-name">Yetkili Temsilci</div>
                <div class="sig-role">Ad Soyad / Imza / Kase</div>
            </div>
        </td>
        <td>
            <div class="sig-line">
                <div class="sig-name">Tarih</div>
                <div class="sig-role">GG / AA / YYYY</div>
            </div>
        </td>
    </tr>
</table>

{{-- FOOTER --}}
<table class="footer">
    <tr>
        <td style="width:60%">
            @if($offer->project)
                @php $p = $offer->project; @endphp
                <div class="f-brand">{{ $p->company_name ?? $p->name }}</div>
                @if($p->company_address)<div>{{ $p->company_address }}</div>@endif
                @if($p->company_phone)
                    <div>Tel: {{ $p->company_phone }}{{ $p->company_email ? '  |  ' . $p->company_email : '' }}</div>
                @endif
                @if($p->tax_number)
                    <div>VKN: {{ $p->tax_number }}{{ $p->tax_office ? ' / ' . $p->tax_office : '' }}</div>
                @endif
            @endif
        </td>
        <td class="f-r" style="width:40%">
            <div class="f-no">{{ $offer->offer_no }}</div>
            <div>{{ now()->format('d.m.Y H:i') }}</div>
            <div>Elektronik ortamda uretilmistir.</div>
        </td>
    </tr>
</table>

</div>
</body>
</html>
