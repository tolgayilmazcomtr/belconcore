<?php

namespace App\Http\Controllers;

use App\Models\Check;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CheckController extends Controller
{
    public function index(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;

        $query = Check::with(['accountingAccount', 'invoice', 'creator'])
            ->where('project_id', $projectId);

        if ($request->filled('type'))   $query->where('type', $request->type);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('due_from')) $query->where('due_date', '>=', $request->due_from);
        if ($request->filled('due_to'))   $query->where('due_date', '<=', $request->due_to);

        $checks = $query->orderBy('due_date')->orderByDesc('id')->get();

        // Append days_until_due
        $today = Carbon::today();
        $checks->each(function ($c) use ($today) {
            $c->days_until_due = $today->diffInDays(Carbon::parse($c->due_date), false);
        });

        return response()->json(['data' => $checks]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'active_project_id'    => 'required|exists:projects,id',
            'type'                 => 'required|in:received,given',
            'check_no'             => 'nullable|string|max:100',
            'amount'               => 'required|numeric|min:0.01',
            'issue_date'           => 'required|date',
            'due_date'             => 'required|date',
            'bank_name'            => 'nullable|string|max:255',
            'branch'               => 'nullable|string|max:255',
            'counterparty'         => 'nullable|string|max:255',
            'description'          => 'nullable|string',
            'status'               => 'nullable|in:pending,cleared,returned,bounced',
            'accounting_account_id'=> 'nullable|exists:accounting_accounts,id',
            'invoice_id'           => 'nullable|exists:invoices,id',
        ]);

        $check = Check::create([
            ...$validated,
            'project_id' => $validated['active_project_id'],
            'status'     => $validated['status'] ?? 'pending',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Çek kaydedildi.',
            'data'    => $check->load(['accountingAccount', 'invoice', 'creator']),
        ], 201);
    }

    public function show(string $id)
    {
        $check = Check::with(['accountingAccount', 'invoice', 'creator'])->findOrFail($id);
        return response()->json(['data' => $check]);
    }

    public function update(Request $request, string $id)
    {
        $check = Check::findOrFail($id);

        $validated = $request->validate([
            'type'                 => 'sometimes|in:received,given',
            'check_no'             => 'nullable|string|max:100',
            'amount'               => 'sometimes|numeric|min:0.01',
            'issue_date'           => 'sometimes|date',
            'due_date'             => 'sometimes|date',
            'bank_name'            => 'nullable|string|max:255',
            'branch'               => 'nullable|string|max:255',
            'counterparty'         => 'nullable|string|max:255',
            'description'          => 'nullable|string',
            'status'               => 'sometimes|in:pending,cleared,returned,bounced',
            'accounting_account_id'=> 'nullable|exists:accounting_accounts,id',
            'invoice_id'           => 'nullable|exists:invoices,id',
        ]);

        $check->update($validated);

        return response()->json([
            'message' => 'Çek güncellendi.',
            'data'    => $check->fresh(['accountingAccount', 'invoice', 'creator']),
        ]);
    }

    public function destroy(string $id)
    {
        Check::findOrFail($id)->delete();
        return response()->json(['message' => 'Çek silindi.']);
    }

    public function summary(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;
        $today = Carbon::today();
        $next30 = $today->copy()->addDays(30);

        $checks = Check::where('project_id', $projectId)->get();

        $received = $checks->where('type', 'received');
        $given    = $checks->where('type', 'given');

        return response()->json(['data' => [
            'received_pending_count'  => $received->where('status', 'pending')->count(),
            'received_pending_amount' => $received->where('status', 'pending')->sum('amount'),
            'given_pending_count'     => $given->where('status', 'pending')->count(),
            'given_pending_amount'    => $given->where('status', 'pending')->sum('amount'),
            'due_soon_count'          => $checks->where('status', 'pending')
                ->filter(fn($c) => Carbon::parse($c->due_date)->between($today, $next30))->count(),
            'overdue_count'           => $checks->where('status', 'pending')
                ->filter(fn($c) => Carbon::parse($c->due_date)->lt($today))->count(),
        ]]);
    }
}
