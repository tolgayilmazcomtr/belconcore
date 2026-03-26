<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\ContractInstallment;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ContractController extends Controller
{
    // ─── Contracts ────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;

        $query = Contract::with(['installments', 'accountingAccount', 'creator'])
            ->where('project_id', $projectId);

        if ($request->filled('type'))   $query->where('type', $request->type);
        if ($request->filled('status')) $query->where('status', $request->status);

        $contracts = $query->orderByDesc('id')->get();

        $today = Carbon::today();
        $contracts->each(function ($c) use ($today) {
            $c->paid_amount      = $c->installments->sum('paid_amount');
            $c->remaining_amount = max(0, $c->total_value - $c->paid_amount);
            $c->overdue_count    = $c->installments->where('status', 'pending')
                ->filter(fn($i) => Carbon::parse($i->due_date)->lt($today))->count();
            $c->next_due = $c->installments->where('status', 'pending')
                ->sortBy('due_date')->first()?->due_date;
        });

        return response()->json(['data' => $contracts]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'active_project_id'    => 'required|exists:projects,id',
            'type'                 => 'required|in:customer_sale,contractor,supplier,other',
            'title'                => 'required|string|max:255',
            'counterparty'         => 'nullable|string|max:255',
            'accounting_account_id'=> 'nullable|exists:accounting_accounts,id',
            'unit_id'              => 'nullable|exists:units,id',
            'total_value'          => 'required|numeric|min:0',
            'start_date'           => 'nullable|date',
            'end_date'             => 'nullable|date',
            'status'               => 'nullable|in:draft,active,completed,cancelled',
            'description'          => 'nullable|string',
        ]);

        $contract = Contract::create([
            ...$validated,
            'project_id' => $validated['active_project_id'],
            'status'     => $validated['status'] ?? 'active',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Sözleşme oluşturuldu.',
            'data'    => $contract->load(['installments', 'accountingAccount']),
        ], 201);
    }

    public function show(string $id)
    {
        $contract = Contract::with(['installments', 'accountingAccount', 'creator'])->findOrFail($id);
        return response()->json(['data' => $contract]);
    }

    public function update(Request $request, string $id)
    {
        $contract = Contract::findOrFail($id);

        $validated = $request->validate([
            'type'                 => 'sometimes|in:customer_sale,contractor,supplier,other',
            'title'                => 'sometimes|string|max:255',
            'counterparty'         => 'nullable|string|max:255',
            'accounting_account_id'=> 'nullable|exists:accounting_accounts,id',
            'unit_id'              => 'nullable|exists:units,id',
            'total_value'          => 'sometimes|numeric|min:0',
            'start_date'           => 'nullable|date',
            'end_date'             => 'nullable|date',
            'status'               => 'sometimes|in:draft,active,completed,cancelled',
            'description'          => 'nullable|string',
        ]);

        $contract->update($validated);

        return response()->json([
            'message' => 'Sözleşme güncellendi.',
            'data'    => $contract->fresh(['installments', 'accountingAccount']),
        ]);
    }

    public function destroy(string $id)
    {
        $contract = Contract::findOrFail($id);
        if ($contract->document_path) {
            Storage::disk('public')->delete($contract->document_path);
        }
        $contract->delete();
        return response()->json(['message' => 'Sözleşme silindi.']);
    }

    // ─── Document Upload ──────────────────────────────────────────────────────

    public function uploadDocument(Request $request, string $id)
    {
        $contract = Contract::findOrFail($id);

        $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:20480',
        ]);

        if ($contract->document_path) {
            Storage::disk('public')->delete($contract->document_path);
        }

        $file = $request->file('document');
        $path = $file->store('contracts', 'public');

        $contract->update([
            'document_path' => $path,
            'document_name' => $file->getClientOriginalName(),
        ]);

        return response()->json([
            'message'       => 'Belge yüklendi.',
            'document_path' => $path,
            'document_name' => $contract->document_name,
            'document_url'  => Storage::disk('public')->url($path),
        ]);
    }

    public function deleteDocument(string $id)
    {
        $contract = Contract::findOrFail($id);
        if ($contract->document_path) {
            Storage::disk('public')->delete($contract->document_path);
        }
        $contract->update(['document_path' => null, 'document_name' => null]);
        return response()->json(['message' => 'Belge silindi.']);
    }

    // ─── Installments ─────────────────────────────────────────────────────────

    public function installments(string $contractId)
    {
        $contract = Contract::findOrFail($contractId);
        return response()->json(['data' => $contract->installments]);
    }

    public function storeInstallment(Request $request, string $contractId)
    {
        $contract = Contract::findOrFail($contractId);

        $validated = $request->validate([
            'installment_no' => 'nullable|integer|min:1',
            'description'    => 'nullable|string|max:255',
            'amount'         => 'required|numeric|min:0',
            'due_date'       => 'required|date',
            'payment_type'   => 'required|in:cash,bank,check,apartment,other',
            'unit_id'        => 'nullable|exists:units,id',
            'status'         => 'nullable|in:pending,paid,overdue,cancelled',
            'paid_amount'    => 'nullable|numeric|min:0',
            'paid_date'      => 'nullable|date',
            'notes'          => 'nullable|string',
        ]);

        if (empty($validated['installment_no'])) {
            $validated['installment_no'] = $contract->installments()->max('installment_no') + 1;
        }

        $installment = ContractInstallment::create([
            ...$validated,
            'contract_id' => $contract->id,
            'project_id'  => $contract->project_id,
            'status'      => $validated['status'] ?? 'pending',
            'paid_amount' => $validated['paid_amount'] ?? 0,
            'created_by'  => $request->user()->id,
        ]);

        return response()->json(['message' => 'Taksit eklendi.', 'data' => $installment], 201);
    }

    public function updateInstallment(Request $request, string $contractId, string $installmentId)
    {
        $installment = ContractInstallment::where('contract_id', $contractId)->findOrFail($installmentId);

        $validated = $request->validate([
            'installment_no' => 'sometimes|integer|min:1',
            'description'    => 'nullable|string|max:255',
            'amount'         => 'sometimes|numeric|min:0',
            'due_date'       => 'sometimes|date',
            'payment_type'   => 'sometimes|in:cash,bank,check,apartment,other',
            'unit_id'        => 'nullable|exists:units,id',
            'status'         => 'sometimes|in:pending,paid,overdue,cancelled',
            'paid_amount'    => 'nullable|numeric|min:0',
            'paid_date'      => 'nullable|date',
            'notes'          => 'nullable|string',
        ]);

        $installment->update($validated);

        return response()->json(['message' => 'Taksit güncellendi.', 'data' => $installment->fresh()]);
    }

    public function destroyInstallment(string $contractId, string $installmentId)
    {
        ContractInstallment::where('contract_id', $contractId)->findOrFail($installmentId)->delete();
        return response()->json(['message' => 'Taksit silindi.']);
    }

    // ─── Faturalaştır (Invoice from Installment) ──────────────────────────────

    public function invoiceInstallment(Request $request, string $contractId, string $installmentId)
    {
        $installment = ContractInstallment::where('contract_id', $contractId)->findOrFail($installmentId);
        $contract    = $installment->contract;

        $validated = $request->validate([
            'account_id'    => 'required|exists:accounting_accounts,id',
            'invoice_no'    => 'nullable|string|max:50',
            'date'          => 'nullable|date',
            'document_type' => 'nullable|in:paper,e-invoice,e-archive',
            'description'   => 'nullable|string',
        ]);

        $type = $contract->type === 'customer_sale' ? 'sales' : 'expense';
        $desc = $validated['description']
            ?? ($contract->title . ' – ' . ($installment->description ?: $installment->installment_no . '. Taksit'));

        $invoice = Invoice::create([
            'project_id'    => $contract->project_id,
            'account_id'    => $validated['account_id'],
            'type'          => $type,
            'invoice_no'    => $validated['invoice_no'] ?? null,
            'date'          => $validated['date'] ?? now()->toDateString(),
            'due_date'      => $installment->due_date,
            'description'   => $desc,
            'document_type' => $validated['document_type'] ?? 'paper',
            'currency'      => 'TRY',
            'subtotal'      => $installment->amount,
            'tax_total'     => 0,
            'total'         => $installment->amount,
            'paid_amount'   => $installment->paid_amount,
            'remaining'     => max(0, $installment->amount - $installment->paid_amount),
            'status'        => $installment->status === 'paid' ? 'paid'
                             : ($installment->paid_amount > 0 ? 'partial' : 'draft'),
        ]);

        InvoiceItem::create([
            'invoice_id'  => $invoice->id,
            'description' => $desc,
            'quantity'    => 1,
            'unit_price'  => $installment->amount,
            'tax_rate'    => 0,
            'tax_amount'  => 0,
            'total'       => $installment->amount,
        ]);

        return response()->json([
            'message'    => 'Fatura oluşturuldu.',
            'invoice_id' => $invoice->id,
            'data'       => $invoice,
        ], 201);
    }

    // ─── Summary ──────────────────────────────────────────────────────────────

    public function summary(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;
        $today     = Carbon::today();
        $in7       = $today->copy()->addDays(7);
        $in30      = $today->copy()->addDays(30);

        $installments = ContractInstallment::whereHas('contract', fn($q) => $q->where('project_id', $projectId))
            ->where('status', 'pending')
            ->with('contract')
            ->orderBy('due_date')
            ->get();

        $installments->each(function ($i) use ($today) {
            if (Carbon::parse($i->due_date)->lt($today)) {
                $i->update(['status' => 'overdue']);
                $i->status = 'overdue';
            }
            $i->days_until_due = $today->diffInDays(Carbon::parse($i->due_date), false);
        });

        $overdue  = $installments->where('status', 'overdue');
        $upcoming = $installments->where('status', 'pending')
            ->filter(fn($i) => Carbon::parse($i->due_date)->between($today, $in30));

        return response()->json(['data' => [
            'overdue_count'         => $overdue->count(),
            'overdue_amount'        => $overdue->sum('amount'),
            'due_in_7_count'        => $installments->where('status', 'pending')
                ->filter(fn($i) => Carbon::parse($i->due_date)->between($today, $in7))->count(),
            'due_in_30_count'       => $upcoming->count(),
            'due_in_30_amount'      => $upcoming->sum('amount'),
            'upcoming_installments' => $upcoming->concat($overdue)->sortBy('due_date')
                ->take(10)->values(),
        ]]);
    }
}
