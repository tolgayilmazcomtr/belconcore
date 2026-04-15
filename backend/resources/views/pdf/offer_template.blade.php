<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Satis Teklifi {{ $offer->offer_no }}</title>
    <style>
        /*
         * DomPDF v3 — flexbox/grid KULLANILMAZ
         * Layout: table, block, float
         * Karakter seti: DejaVu Sans (tam Turkce destegi)
         * Belcon Kurumsal Renk Paleti:
         *   Kirmizi  : #C8102E  (Belcon Red)
         *   Lacivert : #0D1F3C  (Deep Navy)
         *   Gri      : #F4F6F9  (Light BG)
         *   Koyugri  : #4A5568  (Body text)
         */

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html, body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 8.5pt;
            color: #1a202c;
            background: #ffffff;
            line-height: 1.45;
        }

        /* ═══════════════════════════════════════════════════════
           SAYFA KAPSAYICI
        ═══════════════════════════════════════════════════════ */
        .page {
            width: 174mm;
            margin: 0 18mm;
            padding-top: 12mm;
        }

        /* ═══════════════════════════════════════════════════════
           ÜST KIRMIZI ŞERİT
        ═══════════════════════════════════════════════════════ */
        .top-bar {
            background: #C8102E;
            height: 4px;
            margin-bottom: 6mm;
            width: 174mm;
            margin-left: -18mm;
        }

        /* ═══════════════════════════════════════════════════════
           HEADER
        ═══════════════════════════════════════════════════════ */
        .header-wrap {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6mm;
            padding-bottom: 5mm;
            border-bottom: 2px solid #0D1F3C;
        }
        .header-wrap td { vertical-align: middle; }

        .logo-cell { width: 55%; }
        .logo-img  { max-height: 46px; max-width: 140px; }

        .company-name-txt {
            font-size: 15pt;
            font-weight: 700;
            color: #0D1F3C;
            letter-spacing: -0.3px;
        }
        .company-tagline {
            font-size: 7pt;
            color: #C8102E;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-top: 2px;
            font-weight: 600;
        }

        .offer-meta-cell {
            width: 45%;
            text-align: right;
            vertical-align: top;
        }
        .offer-type-lbl {
            font-size: 6.5pt;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #C8102E;
        }
        .offer-number {
            font-size: 14pt;
            font-weight: 700;
            color: #0D1F3C;
            letter-spacing: 0.5px;
            margin: 2px 0 3px 0;
        }

        /* Status badges */
        .s-badge {
            display: inline-block;
            font-size: 6.5pt;
            font-weight: 700;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 2px;
        }
        .s-draft    { background: #EDF2F7; color: #4A5568; border: 1px solid #CBD5E0; }
        .s-sent     { background: #EBF8FF; color: #2B6CB0; border: 1px solid #BEE3F8; }
        .s-accepted { background: #F0FFF4; color: #276749; border: 1px solid #9AE6B4; }
        .s-rejected { background: #FFF5F5; color: #C53030; border: 1px solid #FEB2B2; }

        /* ═══════════════════════════════════════════════════════
           BİLGİ KUTULARI — 2 SÜTUN
        ═══════════════════════════════════════════════════════ */
        .info-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 3mm 0;
            margin-bottom: 5mm;
        }
        .info-box {
            width: 50%;
            vertical-align: top;
            border: 1px solid #E2E8F0;
            border-top: 3px solid #C8102E;
            padding: 3.5mm 4mm;
            background: #FAFBFC;
        }
        .info-box-hd {
            font-size: 6.5pt;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #C8102E;
            margin-bottom: 4px;
            padding-bottom: 3px;
            border-bottom: 1px solid #EDF2F7;
        }
        .info-row-t  { width: 100%; border-collapse: collapse; margin-bottom: 1.5px; }
        .info-row-t td { font-size: 7.5pt; padding: 1.5px 0; vertical-align: top; }
        .lbl { color: #718096; width: 72px; white-space: nowrap; }
        .val { color: #1a202c; font-weight: 600; }

        /* ═══════════════════════════════════════════════════════
           BÖLÜM BAŞLIĞI
        ═══════════════════════════════════════════════════════ */
        .section-hd {
            margin-top: 4.5mm;
            margin-bottom: 2.5mm;
        }
        .section-hd-inner {
            display: inline-block;
            font-size: 6.5pt;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #0D1F3C;
            background: #F4F6F9;
            border-left: 3px solid #C8102E;
            padding: 2px 7px;
        }

        /* ═══════════════════════════════════════════════════════
           FİYAT TABLOSU
        ═══════════════════════════════════════════════════════ */
        .price-tbl { width: 100%; border-collapse: collapse; }
        .price-tbl thead tr th {
            background: #0D1F3C;
            color: #ffffff;
            font-size: 7pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 4.5pt 9pt;
            text-align: left;
            border: none;
        }
        .price-tbl thead tr th.r { text-align: right; }
        .price-tbl tbody tr td {
            padding: 5pt 9pt;
            font-size: 8.5pt;
            color: #2D3748;
            border-bottom: 1px solid #EDF2F7;
        }
        .price-tbl tbody tr td.r { text-align: right; }
        .price-tbl tbody tr.stripe td { background: #F7FAFC; }
        .price-tbl tbody tr.total-row td {
            background: #FFF5F5;
            font-weight: 700;
            font-size: 10pt;
            color: #C8102E;
            border-top: 2px solid #C8102E;
            border-bottom: none;
            padding: 5.5pt 9pt;
        }
        .price-tbl tbody tr.total-row td.r { text-align: right; }
        .disc-txt { color: #C53030; }

        /* ═══════════════════════════════════════════════════════
           GEÇERLİLİK BANDI
        ═══════════════════════════════════════════════════════ */
        .validity-band {
            width: 100%;
            border-collapse: collapse;
            background: #0D1F3C;
            margin-top: 3.5mm;
            margin-bottom: 3.5mm;
        }
        .validity-band td {
            padding: 3mm 5mm;
            font-size: 8pt;
            vertical-align: middle;
        }
        .validity-band .v-lbl { color: #A0AEC0; }
        .validity-band .v-val {
            color: #ffffff;
            font-weight: 700;
            text-align: right;
            font-size: 9pt;
        }

        /* ═══════════════════════════════════════════════════════
           ÖDEME PLANI NOTU (enflasyon bilgisi)
        ═══════════════════════════════════════════════════════ */
        .plan-meta {
            background: #FFFBEB;
            border: 1px solid #F6AD55;
            border-left: 3px solid #DD6B20;
            padding: 2.5mm 4mm;
            font-size: 7pt;
            color: #744210;
            margin-bottom: 2.5mm;
        }
        .plan-meta strong { color: #C05621; }

        /* ═══════════════════════════════════════════════════════
           ÖDEME PLANI TABLOSU
        ═══════════════════════════════════════════════════════ */
        .pay-tbl { width: 100%; border-collapse: collapse; }
        .pay-tbl thead tr th {
            background: #C8102E;
            color: #ffffff;
            font-size: 6.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 4pt 7pt;
            text-align: left;
            border-right: 1px solid rgba(255,255,255,0.15);
        }
        .pay-tbl thead tr th.r { text-align: right; }
        .pay-tbl tbody tr td {
            padding: 4pt 7pt;
            font-size: 7.5pt;
            color: #2D3748;
            border-bottom: 1px solid #EDF2F7;
            border-right: 1px solid #EDF2F7;
        }
        .pay-tbl tbody tr td.r { text-align: right; }
        .pay-tbl tbody tr.stripe td { background: #F7FAFC; }
        .pay-tbl tfoot tr td {
            background: #0D1F3C;
            color: #ffffff;
            font-weight: 700;
            font-size: 8pt;
            padding: 4.5pt 7pt;
            border-top: none;
        }
        .pay-tbl tfoot tr td.r { text-align: right; }
        .inf-pct { color: #F6AD55; font-size: 6pt; }

        /* ═══════════════════════════════════════════════════════
           METİN BLOĞU (düz ödeme planı / notlar)
        ═══════════════════════════════════════════════════════ */
        .txt-block {
            border: 1px solid #E2E8F0;
            border-left: 3px solid #C8102E;
            padding: 3.5mm 5mm;
            margin-bottom: 3.5mm;
            font-size: 8pt;
            color: #2D3748;
            line-height: 1.6;
            background: #FAFBFC;
        }

        /* ═══════════════════════════════════════════════════════
           YASAL UYARI KUTUSU
        ═══════════════════════════════════════════════════════ */
        .legal-box {
            border: 1px solid #E2E8F0;
            background: #F7FAFC;
            padding: 2.5mm 4mm;
            font-size: 6.5pt;
            color: #718096;
            line-height: 1.5;
            margin-top: 3mm;
            margin-bottom: 3.5mm;
        }

        /* ═══════════════════════════════════════════════════════
           İMZA ALANI
        ═══════════════════════════════════════════════════════ */
        .sig-wrap {
            width: 100%;
            border-collapse: separate;
            border-spacing: 5mm 0;
            margin-top: 7mm;
        }
        .sig-cell { width: 33%; vertical-align: bottom; }
        .sig-line-box {
            border-top: 1.5px solid #CBD5E0;
            padding-top: 4px;
            margin-top: 14mm;
        }
        .sig-name  { font-size: 7.5pt; font-weight: 600; color: #2D3748; }
        .sig-title { font-size: 6.5pt; color: #A0AEC0; margin-top: 1px; }

        /* ═══════════════════════════════════════════════════════
           FOOTER
        ═══════════════════════════════════════════════════════ */
        .footer-rule {
            border-top: 2px solid #C8102E;
            margin-top: 6mm;
            margin-bottom: 2.5mm;
        }
        .footer-tbl { width: 100%; border-collapse: collapse; }
        .footer-tbl td {
            font-size: 6.5pt;
            color: #A0AEC0;
            vertical-align: top;
            line-height: 1.6;
            padding: 0;
        }
        .footer-brand {
            font-size: 7pt;
            font-weight: 700;
            color: #0D1F3C;
            margin-bottom: 1px;
        }
        .footer-right { text-align: right; }
        .footer-docno { font-size: 6pt; color: #C8102E; font-weight: 600; letter-spacing: 0.05em; }

        /* ═══════════════════════════════════════════════════════
           ALT KIRMIZI ŞERİT
        ═══════════════════════════════════════════════════════ */
        .bottom-bar {
            background: #C8102E;
            height: 3px;
            margin-top: 5mm;
            width: 174mm;
            margin-left: -18mm;
        }

    </style>
</head>
<body>
<div class="page">

    {{-- ══ ÜST ŞERİT ═══════════════════════════════════════════════ --}}
    <div class="top-bar"></div>

    @php
        $project     = $offer->project;
        $companyName = ($project && $project->company_name) ? $project->company_name : ($project->name ?? 'Belcon');
        $logoPath    = ($project && $project->logo_path) ? storage_path('app/public/' . $project->logo_path) : null;
        $hasLogo     = $logoPath && file_exists($logoPath);

        $statusMap = [
            'draft'    => ['Taslak',        's-draft'],
            'sent'     => ['Gonderildi',    's-sent'],
            'accepted' => ['Kabul Edildi',  's-accepted'],
            'rejected' => ['Reddedildi',    's-rejected'],
        ];
        [$statusLabel, $statusClass] = $statusMap[$offer->status] ?? [$offer->status, 's-draft'];
    @endphp

    {{-- ══ HEADER ══════════════════════════════════════════════════ --}}
    <table class="header-wrap">
        <tr>
            <td class="logo-cell">
                @if($hasLogo)
                    <img src="{{ $logoPath }}" class="logo-img" alt="{{ $companyName }}">
                @else
                    <div class="company-name-txt">{{ $companyName }}</div>
                    <div class="company-tagline">Gayrimenkul &amp; Insaat</div>
                @endif
            </td>
            <td class="offer-meta-cell">
                <div class="offer-type-lbl">Satis Teklifi</div>
                <div class="offer-number">{{ $offer->offer_no }}</div>
                <span class="s-badge {{ $statusClass }}">{{ $statusLabel }}</span>
            </td>
        </tr>
    </table>

    {{-- ══ BİLGİ KUTULARI ══════════════════════════════════════════ --}}
    <table class="info-grid">
        <tr>
            {{-- Müşteri --}}
            <td class="info-box">
                <div class="info-box-hd">Musteri Bilgileri</div>
                @if($offer->customer)
                    @php
                        $c     = $offer->customer;
                        $cName = $c->type === 'corporate'
                            ? $c->company_name
                            : trim("{$c->first_name} {$c->last_name}");
                    @endphp
                    <table class="info-row-t"><tr>
                        <td class="lbl">Ad / Unvan</td>
                        <td class="val">{{ $cName }}</td>
                    </tr></table>
                    @if($c->phone)
                    <table class="info-row-t"><tr>
                        <td class="lbl">Telefon</td>
                        <td class="val">{{ $c->phone }}</td>
                    </tr></table>
                    @endif
                    @if($c->email)
                    <table class="info-row-t"><tr>
                        <td class="lbl">E-posta</td>
                        <td class="val">{{ $c->email }}</td>
                    </tr></table>
                    @endif
                    @if($c->address)
                    <table class="info-row-t"><tr>
                        <td class="lbl">Adres</td>
                        <td class="val">{{ $c->address }}{{ $c->city ? ', '.$c->city : '' }}</td>
                    </tr></table>
                    @endif
                    @if($c->type === 'corporate' && $c->tax_number)
                    <table class="info-row-t"><tr>
                        <td class="lbl">Vergi No</td>
                        <td class="val">{{ $c->tax_number }} / {{ $c->tax_office }}</td>
                    </tr></table>
                    @endif
                @else
                    <div style="font-size:7.5pt;color:#A0AEC0;">Musteri bilgisi girilmemis.</div>
                @endif
            </td>

            {{-- Teklif Detayları --}}
            <td class="info-box">
                <div class="info-box-hd">Teklif Detaylari</div>
                @if($offer->unit)
                    @php $u = $offer->unit; @endphp
                    <table class="info-row-t"><tr>
                        <td class="lbl">Konut</td>
                        <td class="val">{{ $u->block->name ?? '' }} Blok — No: {{ $u->unit_no }}</td>
                    </tr></table>
                    <table class="info-row-t"><tr>
                        <td class="lbl">Tip</td>
                        <td class="val">{{ $u->unit_type ?? '-' }}</td>
                    </tr></table>
                    @if($u->net_area)
                    <table class="info-row-t"><tr>
                        <td class="lbl">Net Alan</td>
                        <td class="val">{{ $u->net_area }} m2</td>
                    </tr></table>
                    @endif
                    @if($u->gross_area)
                    <table class="info-row-t"><tr>
                        <td class="lbl">Brut Alan</td>
                        <td class="val">{{ $u->gross_area }} m2</td>
                    </tr></table>
                    @endif
                    @if($u->floor_no !== null)
                    <table class="info-row-t"><tr>
                        <td class="lbl">Kat</td>
                        <td class="val">{{ $u->floor_no }}. Kat</td>
                    </tr></table>
                    @endif
                @endif
                <table class="info-row-t"><tr>
                    <td class="lbl">Teklif Tarihi</td>
                    <td class="val">{{ $offer->created_at ? $offer->created_at->format('d.m.Y') : now()->format('d.m.Y') }}</td>
                </tr></table>
                @if($offer->valid_until)
                <table class="info-row-t"><tr>
                    <td class="lbl">Son Gecerlilik</td>
                    <td class="val" style="color:#C8102E;">{{ \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') }}</td>
                </tr></table>
                @endif
                @if($offer->creator)
                <table class="info-row-t"><tr>
                    <td class="lbl">Hazirlayan</td>
                    <td class="val">{{ $offer->creator->name }}</td>
                </tr></table>
                @endif
            </td>
        </tr>
    </table>

    {{-- ══ FİYATLANDIRMA ══════════════════════════════════════════ --}}
    <div class="section-hd"><div class="section-hd-inner">Fiyatlandirma</div></div>
    <table class="price-tbl">
        <thead>
            <tr>
                <th style="width:65%">Aciklama</th>
                <th class="r" style="width:35%">Tutar (TL)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Liste / Baz Satis Fiyati</td>
                <td class="r">{{ number_format($offer->base_price, 0, ',', '.') }} TL</td>
            </tr>
            @if($offer->discount_amount > 0)
            <tr class="stripe">
                <td class="disc-txt">Ozel Kampanya / Indirim</td>
                <td class="r disc-txt">- {{ number_format($offer->discount_amount, 0, ',', '.') }} TL</td>
            </tr>
            @endif
            <tr class="total-row">
                <td>NET TEKLIF FIYATI</td>
                <td class="r">{{ number_format($offer->final_price, 0, ',', '.') }} TL</td>
            </tr>
        </tbody>
    </table>

    {{-- ══ GEÇERLİLİK BANDI ═══════════════════════════════════════ --}}
    @if($offer->valid_until)
    <table class="validity-band">
        <tr>
            <td class="v-lbl">Bu teklif asagidaki tarihe kadar gecerlidir:</td>
            <td class="v-val">{{ \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') }}</td>
        </tr>
    </table>
    @endif

    {{-- ══ ÖDEME PLANI ════════════════════════════════════════════ --}}
    @if($offer->payment_plan)
    @php
        $planData   = null;
        $decoded    = json_decode($offer->payment_plan, true);
        if (is_array($decoded) && isset($decoded['items']) && count($decoded['items']) > 0) {
            $planData = $decoded;
        }
        $typeLabels = [
            'downpayment_only'   => 'Tam Pesin',
            'lump_sum'           => 'Tek Seferlik Odeme',
            'equal_installments' => 'Esit Taksitli Odeme',
            'fixed_amount'       => 'Sabit Tutarli Taksit',
            'custom'             => 'Ozel Odeme Plani',
        ];
    @endphp

    <div class="section-hd"><div class="section-hd-inner">Odeme Plani</div></div>

    @if($planData)
        @php
            $annualRate = round((pow(1 + $planData['monthly_inflation_rate'] / 100, 12) - 1) * 100, 1);
            $typeLabel  = $typeLabels[$planData['type']] ?? ucfirst($planData['type']);
        @endphp
        <div class="plan-meta">
            <strong>Plan Tipi:</strong> {{ $typeLabel }}
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>Aylik Enflasyon Korumasi:</strong> %{{ $planData['monthly_inflation_rate'] }}
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>Yillik Karsilik:</strong> ~%{{ $annualRate }}
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>Baz Tarih:</strong> {{ \Carbon\Carbon::parse($planData['offer_date'])->format('d.m.Y') }}
        </div>
        <table class="pay-tbl">
            <thead>
                <tr>
                    <th style="width:5%">#</th>
                    <th style="width:30%">Aciklama</th>
                    <th style="width:20%">Odeme Tarihi</th>
                    <th class="r" style="width:22%">Bugunun Degeri</th>
                    <th class="r" style="width:23%">Odenecek Tutar (TL)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($planData['items'] as $idx => $item)
                <tr class="{{ $idx % 2 === 1 ? 'stripe' : '' }}">
                    <td style="color:#A0AEC0;">{{ $item['no'] }}</td>
                    <td><strong>{{ $item['description'] }}</strong></td>
                    <td>{{ $item['date'] }}</td>
                    <td class="r" style="color:#718096;">{{ number_format($item['real_amount'], 0, ',', '.') }} TL</td>
                    <td class="r">
                        <strong>{{ number_format($item['nominal_amount'], 0, ',', '.') }} TL</strong>
                        @if($item['month_offset'] > 0)
                            @php $infPct = round(($item['nominal_amount'] / max($item['real_amount'], 1) - 1) * 100, 1); @endphp
                            <span class="inf-pct">&nbsp;(+%{{ $infPct }})</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3">GENEL TOPLAM</td>
                    <td class="r" style="color:#A0AEC0;font-size:7pt;">{{ number_format($planData['total_real'], 0, ',', '.') }} TL</td>
                    <td class="r">{{ number_format($planData['total_nominal'], 0, ',', '.') }} TL</td>
                </tr>
            </tfoot>
        </table>
    @else
        <div class="txt-block">{{ $offer->payment_plan }}</div>
    @endif
    @endif

    {{-- ══ NOTLAR ══════════════════════════════════════════════════ --}}
    @if($offer->notes)
    <div class="section-hd"><div class="section-hd-inner">Ozel Notlar ve Kosullar</div></div>
    <div class="txt-block">{{ $offer->notes }}</div>
    @endif

    {{-- ══ YASAL UYARI ════════════════════════════════════════════ --}}
    <div class="legal-box">
        Bu teklif belgesi bilgilendirme amacli olup hukuki baglayicilik tasimamaktadir. Teklif; gecerlilik suresi icinde yetkili temsilci
        tarafindan imzalanmis sozlesme ile gecerlilik kazanir. Belirtilen fiyatlar; aksi acikcca ifade edilmedikce KDV haric olup Turk
        Lirasi cinsindendir. Sirket, onceden bildirimde bulunmaksizin teklif kosullarini degistirme hakkini sakli tutar.
    </div>

    {{-- ══ İMZA ALANI ═════════════════════════════════════════════ --}}
    <table class="sig-wrap">
        <tr>
            <td class="sig-cell">
                <div class="sig-line-box">
                    <div class="sig-name">Musteri</div>
                    <div class="sig-title">Ad Soyad / Imza</div>
                </div>
            </td>
            <td class="sig-cell">
                <div class="sig-line-box">
                    <div class="sig-name">Yetkili Temsilci</div>
                    <div class="sig-title">Ad Soyad / Imza / Kase</div>
                </div>
            </td>
            <td class="sig-cell">
                <div class="sig-line-box">
                    <div class="sig-name">Tarih</div>
                    <div class="sig-title">GG / AA / YYYY</div>
                </div>
            </td>
        </tr>
    </table>

    {{-- ══ FOOTER ═════════════════════════════════════════════════ --}}
    <div class="footer-rule"></div>
    <table class="footer-tbl">
        <tr>
            <td style="width:60%">
                @if($offer->project)
                    @php $p = $offer->project; @endphp
                    <div class="footer-brand">{{ $p->company_name ?? $p->name }}</div>
                    @if($p->company_address)<div>{{ $p->company_address }}</div>@endif
                    @if($p->company_phone)
                        <div>Tel: {{ $p->company_phone }}@if($p->company_email) &nbsp;|&nbsp; {{ $p->company_email }}@endif</div>
                    @endif
                    @if($p->tax_number)<div>VKN: {{ $p->tax_number }}@if($p->tax_office) / {{ $p->tax_office }}@endif</div>@endif
                @endif
            </td>
            <td class="footer-right" style="width:40%">
                <div class="footer-docno">{{ $offer->offer_no }}</div>
                <div>Olusturulma: {{ now()->format('d.m.Y H:i') }}</div>
                <div>Bu belge elektronik ortamda uretilmistir.</div>
            </td>
        </tr>
    </table>

    {{-- ══ ALT ŞERİT ═══════════════════════════════════════════════ --}}
    <div class="bottom-bar"></div>

</div>
</body>
</html>
