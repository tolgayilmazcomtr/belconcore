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
    font-size: 8pt;
    color: #1a1a1a;
    background: #fff;
    line-height: 1.4;
}

.page { width:171mm; margin:11mm 19.5mm; }

/* HEADER */
.hdr { width:100%; border-collapse:collapse; margin-bottom:4mm; }
.hdr td { vertical-align:middle; padding:0; }
.logo-img { max-height:38px; max-width:115px; }
.co-name  { font-size:13pt; font-weight:700; color:#111; letter-spacing:-0.3px; }
.co-sub   { font-size:5.5pt; font-weight:700; color:#C8102E; letter-spacing:0.15em; text-transform:uppercase; margin-top:1px; }
.doc-cell { text-align:right; vertical-align:top; }
.doc-lbl  { font-size:5.5pt; font-weight:700; color:#999; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:1px; }
.doc-no   { font-size:12pt; font-weight:700; color:#111; margin-bottom:3px; }
.s-badge  { display:inline-block; font-size:5.5pt; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; padding:1.5px 7px; border:1px solid; }
.s-draft    { color:#666; border-color:#ccc;    background:#f5f5f5; }
.s-sent     { color:#1a56db; border-color:#a4cafe; background:#eff6ff; }
.s-accepted { color:#057a55; border-color:#6ee7b7; background:#ecfdf5; }
.s-rejected { color:#b91c1c; border-color:#fca5a5; background:#fef2f2; }

.rule { border:none; border-top:2px solid #C8102E; margin-bottom:4.5mm; }

/* META — kompakt 4 sütun */
.meta { width:100%; border-collapse:collapse; margin-bottom:4.5mm; }
.meta td { vertical-align:top; font-size:7.5pt; padding:0; }
.meta-divider { width:1px; background:#e8e8e8; padding:0 3mm; }
.meta-spacer  { width:3mm; }
.col-l { width:82mm; }
.col-r { width:82mm; }

.sec-lbl { font-size:5.5pt; font-weight:700; color:#999; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:2.5px; }
.kv { width:100%; border-collapse:collapse; }
.kv td { font-size:7.5pt; padding:0.8px 0; vertical-align:top; }
.k  { color:#888; width:60px; }
.v  { color:#111; font-weight:600; }

/* SECTION HEADER */
.sh {
    font-size:5.5pt; font-weight:700; color:#888;
    letter-spacing:0.15em; text-transform:uppercase;
    border-bottom:1px solid #e0e0e0;
    padding-bottom:1.5px; margin-top:4mm; margin-bottom:2.5mm;
}

/* FİYAT TABLOSU */
.pt { width:100%; border-collapse:collapse; }
.pt th {
    background:#111; color:#fff;
    font-size:6pt; font-weight:700; text-transform:uppercase; letter-spacing:0.07em;
    padding:3.5pt 7pt; text-align:left;
}
.pt th.r { text-align:right; }
.pt td   { padding:3.5pt 7pt; font-size:8pt; color:#333; border-bottom:1px solid #f0f0f0; }
.pt td.r { text-align:right; }
.pt .s2 td { background:#fafafa; }
.pt .tot td {
    padding:4pt 7pt; font-size:9pt; font-weight:700;
    color:#C8102E; border-top:1.5px solid #ddd; border-bottom:none;
}
.pt .tot td.r { text-align:right; }
.disc { color:#b91c1c; }

/* GEÇERLİLİK */
.val-row { width:100%; border-collapse:collapse; }
.val-row td { padding:2.5mm 0; font-size:7.5pt; border-top:1px solid #f0f0f0; border-bottom:1px solid #f0f0f0; margin-top:2mm; }
.val-lbl  { color:#888; }
.val-date { text-align:right; font-weight:700; color:#C8102E; font-size:8.5pt; }

/* ÖDEME PLANI */
.plan-note { font-size:6.5pt; color:#777; padding:2mm 0; margin-bottom:2mm; border-bottom:1px solid #f0f0f0; }
.ot { width:100%; border-collapse:collapse; }
.ot th {
    background:#1f2937; color:#fff;
    font-size:5.5pt; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;
    padding:3pt 6pt; text-align:left;
}
.ot th.r { text-align:right; }
.ot td   { padding:2.8pt 6pt; font-size:7pt; color:#333; border-bottom:1px solid #f0f0f0; }
.ot td.r { text-align:right; }
.ot .s2 td { background:#fafafa; }
.ot tfoot td { background:#f5f5f5; font-weight:700; font-size:7pt; color:#111; border-top:1.5px solid #ddd; padding:3pt 6pt; }
.ot tfoot td.r { text-align:right; }
.inf { font-size:5pt; color:#b45309; }

/* DÜZYAZI */
.txt { font-size:7.5pt; color:#444; line-height:1.6; border-left:2px solid #ddd; padding-left:3mm; margin-bottom:2mm; }

/* YASAL */
.legal { font-size:5.5pt; color:#bbb; line-height:1.5; border-top:1px solid #f0f0f0; padding-top:2mm; margin-top:3mm; }

/* İMZA */
.sig { width:100%; border-collapse:separate; border-spacing:4mm 0; margin-top:6mm; }
.sig td { width:33%; vertical-align:bottom; }
.sig-line { border-top:1px solid #ccc; padding-top:3px; margin-top:12mm; }
.sig-name { font-size:7pt; font-weight:700; color:#333; }
.sig-role { font-size:5.5pt; color:#bbb; margin-top:1px; }

/* FOOTER */
.ft { width:100%; border-collapse:collapse; border-top:1px solid #e0e0e0; margin-top:5mm; }
.ft td { padding-top:2mm; font-size:5.5pt; color:#bbb; line-height:1.6; vertical-align:top; }
.ft-brand { font-size:6.5pt; font-weight:700; color:#111; margin-bottom:1px; }
.ft-r { text-align:right; }
.ft-no { color:#C8102E; font-weight:700; font-size:6pt; }
</style>
</head>
<body>
<div class="page">

@php
    $project     = $offer->project;
    $companyName = ($project && $project->company_name) ? $project->company_name : ($project->name ?? 'Belcon');
    $logoPath    = ($project && $project->logo_path) ? storage_path('app/public/' . $project->logo_path) : null;
    $hasLogo     = $logoPath && file_exists($logoPath);
    $sMap = [
        'draft'    => ['TASLAK',        's-draft'],
        'sent'     => ['GONDERILDI',    's-sent'],
        'accepted' => ['KABUL EDILDI',  's-accepted'],
        'rejected' => ['REDDEDILDI',    's-rejected'],
    ];
    [$sLabel, $sClass] = $sMap[$offer->status] ?? [$offer->status, 's-draft'];

    $c     = $offer->customer;
    $u     = $offer->unit;
    $cName = null;
    if ($c) {
        $cName = $c->type === 'corporate'
            ? $c->company_name
            : trim($c->first_name . ' ' . $c->last_name);
    }
    if ($u) {
        $blockName = isset($u->block) ? ($u->block->name ?? '') : '';
        $unitLabel = ($blockName ? $blockName . ' Blok — ' : '') . 'No: ' . $u->unit_no;
        $alanParts = [];
        if ($u->net_area)   $alanParts[] = $u->net_area . ' m² net';
        if ($u->gross_area) $alanParts[] = $u->gross_area . ' m² brüt';
        $alanStr = implode(' / ', $alanParts);
        $katRaw  = ($u->floor_no !== null && $u->floor_no !== '') ? (string)$u->floor_no : null;
        $katStr  = $katRaw ? (mb_stripos($katRaw, 'kat') !== false ? $katRaw : $katRaw . '. Kat') : null;
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
                <div class="co-sub">Gayrimenkul &amp; İnşaat</div>
            @endif
        </td>
        <td class="doc-cell" style="width:45%">
            <div class="doc-lbl">Satış Teklifi</div>
            <div class="doc-no">{{ $offer->offer_no }}</div>
            <span class="s-badge {{ $sClass }}">{{ $sLabel }}</span>
        </td>
    </tr>
</table>
<hr class="rule">

{{-- META --}}
<table class="meta">
    <tr>
        <td class="col-l">
            <div class="sec-lbl">Müşteri</div>
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
        <td class="meta-divider"><div style="width:1px;background:#e8e8e8;height:100%;">&nbsp;</div></td>
        <td class="meta-spacer"></td>
        <td class="col-r">
            <div class="sec-lbl">Teklif &amp; Gayrimenkul</div>
            @if($u)
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
            <table class="kv"><tr><td class="k">Tarih</td><td class="v">{{ $offer->created_at ? $offer->created_at->format('d.m.Y') : now()->format('d.m.Y') }}</td></tr></table>
            @if($offer->valid_until)
                <table class="kv"><tr><td class="k">Geçerlilik</td><td class="v" style="color:#C8102E;font-weight:700;">{{ \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') }}</td></tr></table>
            @endif
            @if($offer->creator)
                <table class="kv"><tr><td class="k">Hazırlayan</td><td class="v">{{ $offer->creator->name }}</td></tr></table>
            @endif
        </td>
    </tr>
</table>

{{-- FİYATLANDIRMA --}}
<div class="sh">Fiyatlandırma</div>
<table class="pt">
    <thead>
        <tr>
            <th style="width:65%">Açıklama</th>
            <th class="r" style="width:35%">Tutar</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Liste / Baz Satış Fiyatı</td>
            <td class="r">{{ number_format($offer->base_price, 0, ',', '.') }} ₺</td>
        </tr>
        @if($offer->discount_amount > 0)
        <tr class="s2">
            <td class="disc">Özel İndirim</td>
            <td class="r disc">- {{ number_format($offer->discount_amount, 0, ',', '.') }} ₺</td>
        </tr>
        @endif
        <tr class="tot">
            <td>Net Teklif Fiyatı</td>
            <td class="r">{{ number_format($offer->final_price, 0, ',', '.') }} ₺</td>
        </tr>
    </tbody>
</table>

{{-- ÖDEME PLANI --}}
@if($offer->payment_plan)
@php
    $planData = null;
    $decoded  = json_decode($offer->payment_plan, true);
    if (is_array($decoded) && !empty($decoded['items'])) $planData = $decoded;
    $typeLabels = [
        'downpayment_only'   => 'Tam Peşin',
        'lump_sum'           => 'Tek Seferlik',
        'equal_installments' => 'Eşit Taksit',
        'fixed_amount'       => 'Sabit Tutar',
        'custom'             => 'Özel Plan',
    ];
@endphp
<div class="sh">Ödeme Planı</div>
@if($planData)
    @php
        $annualRate = round((pow(1 + $planData['monthly_inflation_rate'] / 100, 12) - 1) * 100, 1);
        $tLabel     = $typeLabels[$planData['type']] ?? '-';
    @endphp
    <div class="plan-note">
        Plan: <strong>{{ $tLabel }}</strong>
        &nbsp;·&nbsp; Aylık enflasyon koruması: <strong>%{{ $planData['monthly_inflation_rate'] }}</strong> (~yıllık %{{ $annualRate }})
        &nbsp;·&nbsp; Baz: {{ \Carbon\Carbon::parse($planData['offer_date'])->format('d.m.Y') }}
    </div>
    <table class="ot">
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
            <tr class="{{ $idx % 2 === 1 ? 's2' : '' }}">
                <td style="color:#bbb;">{{ $item['no'] }}</td>
                <td><strong>{{ $item['description'] }}</strong></td>
                <td>{{ $item['date'] }}</td>
                <td class="r" style="color:#aaa;">{{ number_format($item['real_amount'], 0, ',', '.') }} ₺</td>
                <td class="r">
                    <strong>{{ number_format($item['nominal_amount'], 0, ',', '.') }} ₺</strong>
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
                <td class="r" style="color:#888;">{{ number_format($planData['total_real'], 0, ',', '.') }} ₺</td>
                <td class="r">{{ number_format($planData['total_nominal'], 0, ',', '.') }} ₺</td>
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
    Bu belge bilgilendirme amaçlı olup hukuki bağlayıcılık taşımaz. Satış; geçerlilik süresi içinde taraflarca imzalanmış satış sözleşmesi ile kesinleşir.
    Fiyatlar KDV hariç Türk Lirası cinsindendir. Şirket, önceden bildirimde bulunmaksızın teklif koşullarını değiştirme hakkını saklı tutar.
</div>

{{-- İMZA --}}
<table class="sig">
    <tr>
        <td>
            <div class="sig-line">
                <div class="sig-name">Müşteri</div>
                <div class="sig-role">Ad Soyad / İmza</div>
            </div>
        </td>
        <td>
            <div class="sig-line">
                <div class="sig-name">Yetkili Temsilci</div>
                <div class="sig-role">Ad Soyad / İmza / Kaşe</div>
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
<table class="ft">
    <tr>
        <td style="width:60%">
            @if($offer->project)
                @php $p = $offer->project; @endphp
                <div class="ft-brand">{{ $p->company_name ?? $p->name }}</div>
                @if($p->company_address)<div>{{ $p->company_address }}</div>@endif
                @if($p->company_phone)<div>Tel: {{ $p->company_phone }}{{ $p->company_email ? '  |  ' . $p->company_email : '' }}</div>@endif
                @if($p->tax_number)<div>VKN: {{ $p->tax_number }}{{ $p->tax_office ? ' / ' . $p->tax_office : '' }}</div>@endif
            @endif
        </td>
        <td class="ft-r" style="width:40%">
            <div class="ft-no">{{ $offer->offer_no }}</div>
            <div>{{ now()->format('d.m.Y H:i') }}</div>
            <div>Elektronik ortamda üretilmiştir.</div>
        </td>
    </tr>
</table>

</div>
</body>
</html>
