<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Teklif - {{ $offer->offer_no }}</title>
    <style>
        @page {
            margin: 1cm;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif; /* DejaVu supports Turkish chars */
            color: #333;
            font-size: 13px;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .header {
            width: 100%;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header table {
            width: 100%;
        }
        .header td {
            vertical-align: middle;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            text-transform: uppercase;
        }
        .project-name {
            font-size: 16px;
            color: #64748b;
        }
        .title {
            text-align: right;
            font-size: 28px;
            font-weight: bold;
            color: #0ea5e9;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e293b;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table th, .info-table td {
            text-align: left;
            padding: 5px 0;
            font-size: 13px;
        }
        .info-table th {
            width: 120px;
            color: #64748b;
            font-weight: normal;
        }
        .info-table td {
            font-weight: bold;
        }
        
        .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .item-table th {
            background-color: #f1f5f9;
            color: #1e293b;
            font-weight: bold;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #cbd5e1;
        }
        .item-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .text-right {
            text-align: right !important;
        }
        .text-center {
            text-align: center !important;
        }
        .totals-table {
            width: 40%;
            float: right;
            margin-top: 20px;
        }
        .totals-table th, .totals-table td {
            padding: 8px 12px;
            text-align: right;
        }
        .totals-table th {
            color: #64748b;
            font-weight: normal;
        }
        .totals-table .final-price {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            border-top: 2px solid #1e293b;
        }
        .clear {
            clear: both;
        }
        .notes-section {
            margin-top: 40px;
            background-color: #f8fafc;
            padding: 15px;
            border-left: 4px solid #0ea5e9;
            border-radius: 4px;
        }
        .footer {
            position: fixed;
            bottom: 0px;
            left: 0px;
            right: 0px;
            height: 50px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
        }
        .signatures {
            margin-top: 80px;
            width: 100%;
        }
        .signature-box {
            width: 45%;
            float: left;
            text-align: center;
        }
        .signature-box.right {
            float: right;
        }
        .signature-line {
            margin-top: 60px;
            border-top: 1px solid #333;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
            padding-top: 5px;
        }
    </style>
</head>
<body>

    <div class="header">
        <table>
            <tr>
                <td style="width: 50%;">
                    <div class="company-name">{{ $offer->project->name ?? 'BELCON CORE' }}</div>
                    <div class="project-name">Gayrimenkul Satış Teklifi</div>
                </td>
                <td style="width: 50%;" class="title">
                    TEKLİF
                </td>
            </tr>
        </table>
    </div>

    <table style="width: 100%; margin-bottom: 30px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 20px;">
                <div class="section-title">Müşteri Bilgileri</div>
                <table class="info-table">
                    <tr>
                        <th>Müşteri:</th>
                        <td>{{ $offer->customer->type === 'corporate' ? $offer->customer->company_name : $offer->customer->first_name . ' ' . $offer->customer->last_name }}</td>
                    </tr>
                    @if($offer->customer->phone)
                    <tr>
                        <th>Telefon:</th>
                        <td>{{ $offer->customer->phone }}</td>
                    </tr>
                    @endif
                    @if($offer->customer->email)
                    <tr>
                        <th>E-Posta:</th>
                        <td>{{ $offer->customer->email }}</td>
                    </tr>
                    @endif
                    @if($offer->customer->address)
                    <tr>
                        <th>Adres:</th>
                        <td>{{ $offer->customer->address }}
                            @if($offer->customer->district || $offer->customer->city)
                                <br>{{ $offer->customer->district }} / {{ $offer->customer->city }}
                            @endif
                        </td>
                    </tr>
                    @endif
                </table>
            </td>
            <td style="width: 50%; vertical-align: top;">
                <div class="section-title">Teklif Bilgileri</div>
                <table class="info-table">
                    <tr>
                        <th>Teklif No:</th>
                        <td>{{ $offer->offer_no }}</td>
                    </tr>
                    <tr>
                        <th>Tarih:</th>
                        <td>{{ $offer->created_at->format('d.m.Y') }}</td>
                    </tr>
                    <tr>
                        <th>Geçerlilik:</th>
                        <td>{{ $offer->valid_until ? \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') : 'Belirtilmemiş' }}</td>
                    </tr>
                    <tr>
                        <th>Hazırlayan:</th>
                        <td>{{ $offer->creator->name ?? 'Sistem' }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="section">
        <div class="section-title">Teklif Edilen Gayrimenkul (Ünite)</div>
        <table class="item-table">
            <thead>
                <tr>
                    <th>Blok</th>
                    <th>Ünite No</th>
                    <th>Kat</th>
                    <th>Oda Tipi</th>
                    <th class="text-right">Brüt / Net (m²)</th>
                    <th class="text-right">Liste Fiyatı</th>
                </tr>
            </thead>
            <tbody>
                @if($offer->unit)
                <tr>
                    <td>{{ $offer->unit->block->name ?? '-' }}</td>
                    <td><b>{{ $offer->unit->unit_no ?? '-' }}</b></td>
                    <td>{{ $offer->unit->floor ?? '-' }}</td>
                    <td>{{ $offer->unit->room_types ?? '-' }}</td>
                    <td class="text-right">{{ $offer->unit->gross_area ?? '-' }} / {{ $offer->unit->net_area ?? '-' }}</td>
                    <td class="text-right">{{ number_format($offer->base_price, 2, ',', '.') }} ₺</td>
                </tr>
                @else
                <tr>
                    <td colspan="6" class="text-center">Özel bir ünite seçilmedi.</td>
                </tr>
                <tr>
                    <td colspan="5">Pazarlık Tutarı (Belirtilmemiş Ünite)</td>
                    <td class="text-right">{{ number_format($offer->base_price, 2, ',', '.') }} ₺</td>
                </tr>
                @endif
            </tbody>
        </table>

        <table class="totals-table">
            <tr>
                <th>Liste Fiyatı:</th>
                <td>{{ number_format($offer->base_price, 2, ',', '.') }} ₺</td>
            </tr>
            @if($offer->discount_amount > 0)
            <tr>
                <th>İndirim:</th>
                <td style="color: #ef4444;">-{{ number_format($offer->discount_amount, 2, ',', '.') }} ₺</td>
            </tr>
            @endif
            <tr>
                <th class="final-price">Net Fiyat (KDV Dahil):</th>
                <td class="final-price">{{ number_format($offer->final_price, 2, ',', '.') }} ₺</td>
            </tr>
        </table>
        <div class="clear"></div>
    </div>

    @if($offer->payment_plan)
    <div class="section">
        <div class="section-title">Ödeme Planı</div>
        <p style="font-size: 13px; line-height: 1.6;">
            {!! nl2br(e($offer->payment_plan)) !!}
        </p>
    </div>
    @endif

    @if($offer->notes)
    <div class="notes-section">
        <strong>Genel Şartlar ve Notlar:</strong><br>
        {!! nl2br(e($offer->notes)) !!}
    </div>
    @endif

    <div class="signatures">
        <div class="signature-box">
            <b>MÜŞTERİ ONAYI</b>
            <div class="signature-line">Ad, Soyad / İmza</div>
        </div>
        <div class="signature-box right">
            <b>SATIŞ TEMSİLCİSİ</b>
            <div class="signature-line">{{ $offer->creator->name ?? 'İmza' }}</div>
        </div>
        <div class="clear"></div>
    </div>

    <div class="footer">
        Bu belge sistem tarafından {{ now()->format('d.m.Y H:i') }} tarihinde elektronik olarak üretilmiştir. / Belcon Core ERP
    </div>

</body>
</html>
