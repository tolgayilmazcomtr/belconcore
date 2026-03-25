<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
.page { padding: 36px; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
.company-name { font-size: 18px; font-weight: bold; color: #0f172a; }
.project-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
.invoice-title { text-align: right; }
.invoice-title h1 { font-size: 20px; font-weight: bold; color: #1d4ed8; letter-spacing: 1px; }
.invoice-title .no { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 4px; }
.invoice-title .status { display: inline-block; margin-top: 6px; padding: 2px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #dbeafe; color: #1d4ed8; }
.meta-grid { display: flex; gap: 24px; margin-bottom: 24px; }
.meta-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
.meta-box .label { font-size: 9px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.meta-box .value { font-size: 11px; color: #1e293b; font-weight: 500; }
.meta-box .sub { font-size: 10px; color: #64748b; margin-top: 2px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
thead tr { background: #0f172a; color: #fff; }
thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; }
thead th.right { text-align: right; }
tbody tr { border-bottom: 1px solid #f1f5f9; }
tbody tr:nth-child(even) { background: #f8fafc; }
tbody td { padding: 8px 10px; font-size: 10px; }
tbody td.right { text-align: right; }
.totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
.totals-box { width: 220px; }
.totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; color: #475569; }
.totals-row.total { border-top: 2px solid #0f172a; margin-top: 4px; padding-top: 8px; font-size: 13px; font-weight: bold; color: #0f172a; }
.payments-section { margin-bottom: 20px; }
.section-title { font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
.remaining-box { border: 2px solid; border-radius: 6px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.remaining-box.paid { border-color: #16a34a; background: #f0fdf4; }
.remaining-box.unpaid { border-color: #dc2626; background: #fef2f2; }
.remaining-box .label { font-size: 10px; font-weight: 600; }
.remaining-box.paid .label { color: #16a34a; }
.remaining-box.unpaid .label { color: #dc2626; }
.remaining-box .amount { font-size: 15px; font-weight: bold; }
.remaining-box.paid .amount { color: #16a34a; }
.remaining-box.unpaid .amount { color: #dc2626; }
.notes { font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; }
.notes strong { color: #475569; }
</style>
</head>
<body>
<div class="page">

    {{-- Header --}}
    <div class="header">
        <div>
            <div class="company-name">{{ $invoice->project->name ?? 'BelconCORE' }}</div>
            <div class="project-sub">Muhasebe / Fatura Belgesi</div>
        </div>
        <div class="invoice-title">
            <h1>{{ $typeLabel }}</h1>
            @if($invoice->invoice_no)
                <div class="no">{{ $invoice->invoice_no }}</div>
            @endif
            <span class="status">{{ $statusLabel }}</span>
        </div>
    </div>

    {{-- Meta --}}
    <div class="meta-grid">
        <div class="meta-box">
            <div class="label">Cari / Hesap</div>
            <div class="value">{{ $invoice->account->name ?? '—' }}</div>
            @if($invoice->account?->tax_number)
                <div class="sub">VKN: {{ $invoice->account->tax_number }}</div>
            @endif
            @if($invoice->account?->tax_office)
                <div class="sub">{{ $invoice->account->tax_office }} VD</div>
            @endif
            @if($invoice->account?->address)
                <div class="sub">{{ $invoice->account->address }}{{ $invoice->account?->city ? ', '.$invoice->account->city : '' }}</div>
            @endif
        </div>
        <div class="meta-box">
            <div class="label">Fatura Tarihi</div>
            <div class="value">{{ \Carbon\Carbon::parse($invoice->date)->format('d.m.Y') }}</div>
            @if($invoice->due_date)
                <div class="label" style="margin-top:8px;">Vade Tarihi</div>
                <div class="value">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d.m.Y') }}</div>
            @endif
        </div>
        <div class="meta-box">
            <div class="label">Açıklama</div>
            <div class="value">{{ $invoice->description ?? '—' }}</div>
            @if($invoice->category)
                <div class="sub">Kategori: {{ $invoice->category }}</div>
            @endif
            @if($invoice->document_type && $invoice->document_type !== 'paper')
                <div class="sub" style="text-transform:uppercase;">{{ str_replace('-', ' ', $invoice->document_type) }}</div>
            @endif
        </div>
    </div>

    {{-- Items Table --}}
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Hizmet / Ürün</th>
                <th>Birim</th>
                <th class="right">Miktar</th>
                <th class="right">Birim Fiyat</th>
                <th class="right">KDV %</th>
                <th class="right">KDV</th>
                <th class="right">Tutar</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $item->description }}</td>
                <td>{{ $item->unit }}</td>
                <td class="right">{{ number_format($item->quantity, 2, ',', '.') }}</td>
                <td class="right">{{ number_format($item->unit_price, 2, ',', '.') }} ₺</td>
                <td class="right">%{{ $item->tax_rate }}</td>
                <td class="right">{{ number_format($item->tax_amount, 2, ',', '.') }} ₺</td>
                <td class="right">{{ number_format($item->total, 2, ',', '.') }} ₺</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Totals --}}
    <div class="totals">
        <div class="totals-box">
            <div class="totals-row">
                <span>Ara Toplam</span>
                <span>{{ number_format($invoice->subtotal, 2, ',', '.') }} ₺</span>
            </div>
            <div class="totals-row">
                <span>KDV Toplam</span>
                <span>{{ number_format($invoice->tax_total, 2, ',', '.') }} ₺</span>
            </div>
            <div class="totals-row total">
                <span>GENEL TOPLAM</span>
                <span>{{ number_format($invoice->total, 2, ',', '.') }} ₺</span>
            </div>
        </div>
    </div>

    {{-- Payments --}}
    @if($invoice->payments->count() > 0)
    <div class="payments-section">
        <div class="section-title">Ödeme Kayıtları</div>
        <table>
            <thead>
                <tr>
                    <th>Tarih</th>
                    <th>Yöntem</th>
                    <th>Referans</th>
                    <th class="right">Tutar</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->payments as $p)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($p->date)->format('d.m.Y') }}</td>
                    <td>{{ $methodLabels[$p->method] ?? $p->method }}</td>
                    <td>{{ $p->reference_no ?? $p->bank_name ?? '—' }}</td>
                    <td class="right">{{ number_format($p->amount, 2, ',', '.') }} ₺</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- Remaining --}}
    <div class="remaining-box {{ $invoice->remaining <= 0 ? 'paid' : 'unpaid' }}">
        <div class="label">
            {{ $invoice->remaining <= 0 ? 'TAM ÖDEME YAPILDI' : 'KALAN TUTAR' }}
        </div>
        <div class="amount">
            {{ number_format(max(0, $invoice->remaining), 2, ',', '.') }} ₺
        </div>
    </div>

    {{-- Notes --}}
    @if($invoice->notes)
    <div class="notes">
        <strong>Notlar:</strong> {{ $invoice->notes }}
    </div>
    @endif

</div>
</body>
</html>
