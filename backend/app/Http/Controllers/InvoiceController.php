<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\AccountingAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;

        $query = Invoice::with(['account', 'items'])
            ->where('project_id', $projectId);

        if ($request->filled('type')) $query->where('type', $request->type);
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('account_id')) $query->where('account_id', $request->account_id);
        if ($request->filled('date_from')) $query->where('date', '>=', $request->date_from);
        if ($request->filled('date_to'))   $query->where('date', '<=', $request->date_to);
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('invoice_no', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%")
                  ->orWhereHas('account', fn($aq) => $aq->where('name', 'like', "%{$s}%"));
            });
        }

        $invoices = $query->orderByDesc('date')->orderByDesc('id')->paginate(50);
        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'active_project_id' => 'required|exists:projects,id',
            'account_id'   => 'nullable|exists:accounting_accounts,id',
            'type'         => 'required|in:sales,purchase',
            'invoice_no'   => 'nullable|string|max:100',
            'date'         => 'required|date',
            'due_date'     => 'nullable|date',
            'description'  => 'nullable|string',
            'category'     => 'nullable|string|max:100',
            'currency'     => 'nullable|string|max:10',
            'document_type'=> 'nullable|in:paper,e-invoice,e-archive',
            'notes'        => 'nullable|string',
            'items'        => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity'    => 'required|numeric|min:0',
            'items.*.unit'        => 'nullable|string',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'items.*.tax_rate'    => 'required|numeric|in:0,1,8,10,18,20',
        ]);

        DB::beginTransaction();
        try {
            // Compute totals
            $subtotal = 0; $taxTotal = 0;
            foreach ($validated['items'] as $item) {
                $lineTotal  = $item['quantity'] * $item['unit_price'];
                $taxAmount  = $lineTotal * ($item['tax_rate'] / 100);
                $subtotal  += $lineTotal;
                $taxTotal  += $taxAmount;
            }
            $total = $subtotal + $taxTotal;

            $invoice = Invoice::create([
                'project_id'    => $validated['active_project_id'],
                'account_id'    => $validated['account_id'] ?? null,
                'type'          => $validated['type'],
                'invoice_no'    => $validated['invoice_no'] ?? null,
                'date'          => $validated['date'],
                'due_date'      => $validated['due_date'] ?? null,
                'description'   => $validated['description'] ?? null,
                'category'      => $validated['category'] ?? null,
                'currency'      => $validated['currency'] ?? 'TRY',
                'document_type' => $validated['document_type'] ?? 'paper',
                'subtotal'      => $subtotal,
                'tax_total'     => $taxTotal,
                'total'         => $total,
                'remaining'     => $total,
                'status'        => 'draft',
                'notes'         => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $i => $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $taxAmount = $lineTotal * ($item['tax_rate'] / 100);
                InvoiceItem::create([
                    'invoice_id'  => $invoice->id,
                    'description' => $item['description'],
                    'quantity'    => $item['quantity'],
                    'unit'        => $item['unit'] ?? 'Adet',
                    'unit_price'  => $item['unit_price'],
                    'tax_rate'    => $item['tax_rate'],
                    'tax_amount'  => $taxAmount,
                    'total'       => $lineTotal + $taxAmount,
                    'sort_order'  => $i,
                ]);
            }

            // Update account balance
            if ($invoice->account_id) {
                AccountingAccount::find($invoice->account_id)?->recalculateBalance();
            }

            DB::commit();
            return response()->json([
                'message' => 'Fatura oluşturuldu.',
                'data'    => $invoice->load(['account', 'items', 'payments']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Hata: ' . $e->getMessage()], 500);
        }
    }

    public function show(string $id)
    {
        $invoice = Invoice::with(['account', 'items', 'payments.creator'])->findOrFail($id);
        return response()->json(['data' => $invoice]);
    }

    public function update(Request $request, string $id)
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'invoice_no'   => 'nullable|string|max:100',
            'date'         => 'sometimes|date',
            'due_date'     => 'nullable|date',
            'description'  => 'nullable|string',
            'category'     => 'nullable|string|max:100',
            'status'       => 'sometimes|in:draft,sent,paid,partial,cancelled',
            'notes'        => 'nullable|string',
            'items'        => 'sometimes|array|min:1',
            'items.*.description' => 'required_with:items|string',
            'items.*.quantity'    => 'required_with:items|numeric|min:0',
            'items.*.unit'        => 'nullable|string',
            'items.*.unit_price'  => 'required_with:items|numeric|min:0',
            'items.*.tax_rate'    => 'required_with:items|numeric',
        ]);

        DB::beginTransaction();
        try {
            $invoice->update($validated);

            if (!empty($validated['items'])) {
                $invoice->items()->delete();
                $subtotal = 0; $taxTotal = 0;
                foreach ($validated['items'] as $i => $item) {
                    $lineTotal = $item['quantity'] * $item['unit_price'];
                    $taxAmount = $lineTotal * ($item['tax_rate'] / 100);
                    $subtotal += $lineTotal;
                    $taxTotal += $taxAmount;
                    InvoiceItem::create([
                        'invoice_id'  => $invoice->id,
                        'description' => $item['description'],
                        'quantity'    => $item['quantity'],
                        'unit'        => $item['unit'] ?? 'Adet',
                        'unit_price'  => $item['unit_price'],
                        'tax_rate'    => $item['tax_rate'],
                        'tax_amount'  => $taxAmount,
                        'total'       => $lineTotal + $taxAmount,
                        'sort_order'  => $i,
                    ]);
                }
                $total = $subtotal + $taxTotal;
                $paid  = $invoice->payments()->sum('amount');
                $invoice->update([
                    'subtotal'   => $subtotal,
                    'tax_total'  => $taxTotal,
                    'total'      => $total,
                    'paid_amount'=> $paid,
                    'remaining'  => max(0, $total - $paid),
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Fatura güncellendi.', 'data' => $invoice->fresh(['account', 'items', 'payments'])]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Hata: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(string $id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();
        return response()->json(['message' => 'Fatura silindi.']);
    }
}
