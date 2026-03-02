<?php

namespace App\Http\Controllers;

use App\Models\AccountingPayment;
use App\Models\Invoice;
use Illuminate\Http\Request;

class AccountingPaymentController extends Controller
{
    public function index(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;

        $query = AccountingPayment::with(['invoice', 'account', 'creator'])
            ->where('project_id', $projectId);

        if ($request->filled('invoice_id')) $query->where('invoice_id', $request->invoice_id);
        if ($request->filled('account_id')) $query->where('account_id', $request->account_id);
        if ($request->filled('method'))     $query->where('method', $request->method);
        if ($request->filled('date_from'))  $query->where('date', '>=', $request->date_from);
        if ($request->filled('date_to'))    $query->where('date', '<=', $request->date_to);

        $payments = $query->orderByDesc('date')->orderByDesc('id')->get();
        return response()->json(['data' => $payments]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'active_project_id' => 'required|exists:projects,id',
            'invoice_id'     => 'required|exists:invoices,id',
            'account_id'     => 'nullable|exists:accounting_accounts,id',
            'amount'         => 'required|numeric|min:0.01',
            'date'           => 'required|date',
            'method'         => 'required|in:cash,bank,check,credit_card,other',
            'bank_name'      => 'nullable|string|max:255',
            'reference_no'   => 'nullable|string|max:100',
            'receipt_no'     => 'nullable|string|max:100',
            'check_due_date' => 'nullable|date',
            'notes'          => 'nullable|string',
        ]);

        $payment = AccountingPayment::create([
            ...$validated,
            'project_id' => $validated['active_project_id'],
            'created_by' => $request->user()->id,
        ]);

        // Update invoice paid/remaining
        $invoice = Invoice::find($validated['invoice_id']);
        if ($invoice) {
            $paid      = $invoice->payments()->sum('amount');
            $remaining = max(0, $invoice->total - $paid);
            $status    = $remaining <= 0 ? 'paid' : ($paid > 0 ? 'partial' : $invoice->status);
            $invoice->update(['paid_amount' => $paid, 'remaining' => $remaining, 'status' => $status]);
            // Update account balance
            $invoice->account?->recalculateBalance();
        }

        return response()->json([
            'message' => 'Ödeme kaydedildi.',
            'data'    => $payment->load(['invoice', 'account', 'creator']),
        ], 201);
    }

    public function destroy(string $id)
    {
        $payment = AccountingPayment::findOrFail($id);
        $invoiceId  = $payment->invoice_id;
        $accountId  = $payment->account_id;
        $payment->delete();

        // Recalculate invoice
        $invoice = Invoice::find($invoiceId);
        if ($invoice) {
            $paid      = $invoice->payments()->sum('amount');
            $remaining = max(0, $invoice->total - $paid);
            $status    = $remaining <= 0 ? 'paid' : ($paid > 0 ? 'partial' : 'sent');
            $invoice->update(['paid_amount' => $paid, 'remaining' => $remaining, 'status' => $status]);
        }

        return response()->json(['message' => 'Ödeme silindi.']);
    }
}
