<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\ContractInstallment;
use Illuminate\Http\Request;
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

        // Append computed fields
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
        Contract::findOrFail($id)->delete();
        return response()->json(['message' => 'Sözleşme silindi.']);
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

        // auto installment_no
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

        return response()->json([
            'message' => 'Taksit eklendi.',
            'data'    => $installment,
        ], 201);
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

        return response()->json([
            'message' => 'Taksit güncellendi.',
            'data'    => $installment->fresh(),
        ]);
    }

    public function destroyInstallment(string $contractId, string $installmentId)
    {
        ContractInstallment::where('contract_id', $contractId)->findOrFail($installmentId)->delete();
        return response()->json(['message' => 'Taksit silindi.']);
    }

    // ─── Summary (for dashboard/sidebar badge) ───────────────────────────────

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

        // Auto-mark overdue
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
            'overdue_count'          => $overdue->count(),
            'overdue_amount'         => $overdue->sum('amount'),
            'due_in_7_count'         => $installments->where('status', 'pending')
                ->filter(fn($i) => Carbon::parse($i->due_date)->between($today, $in7))->count(),
            'due_in_30_count'        => $upcoming->count(),
            'due_in_30_amount'       => $upcoming->sum('amount'),
            'upcoming_installments'  => $upcoming->concat($overdue)->sortBy('due_date')
                ->take(10)->values(),
        ]]);
    }
}
