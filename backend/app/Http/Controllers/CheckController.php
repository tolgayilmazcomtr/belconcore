<?php

namespace App\Http\Controllers;

use App\Models\Check;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class CheckController extends Controller
{
    public function index(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;

        $query = Check::with(['accountingAccount', 'invoice', 'creator'])
            ->where('project_id', $projectId);

        if ($request->filled('type'))        $query->where('type', $request->type);
        if ($request->filled('document_type')) $query->where('document_type', $request->document_type);
        if ($request->filled('status'))      $query->where('status', $request->status);
        if ($request->filled('due_from'))    $query->where('due_date', '>=', $request->due_from);
        if ($request->filled('due_to'))      $query->where('due_date', '<=', $request->due_to);

        $checks = $query->orderBy('due_date')->orderByDesc('id')->get();

        $today = Carbon::today();
        $checks->each(function ($c) use ($today) {
            $c->days_until_due = $today->diffInDays(Carbon::parse($c->due_date), false);
            if ($c->attachment_path) {
                $c->attachment_url = Storage::url($c->attachment_path);
            }
        });

        return response()->json(['data' => $checks]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'active_project_id'    => 'required|exists:projects,id',
            'type'                 => 'required|in:received,given',
            'document_type'        => 'nullable|in:check,note',
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
            'attachment'           => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('checks', 'public');
        }

        $check = Check::create([
            ...$validated,
            'project_id'    => $validated['active_project_id'],
            'document_type' => $validated['document_type'] ?? 'check',
            'status'        => $validated['status'] ?? 'pending',
            'created_by'    => $request->user()->id,
            'attachment_path' => $attachmentPath,
        ]);

        $check->refresh();
        if ($check->attachment_path) {
            $check->attachment_url = Storage::url($check->attachment_path);
        }

        return response()->json([
            'message' => 'Kaydedildi.',
            'data'    => $check->load(['accountingAccount', 'invoice', 'creator']),
        ], 201);
    }

    public function show(string $id)
    {
        $check = Check::with(['accountingAccount', 'invoice', 'creator'])->findOrFail($id);
        if ($check->attachment_path) {
            $check->attachment_url = Storage::url($check->attachment_path);
        }
        return response()->json(['data' => $check]);
    }

    public function update(Request $request, string $id)
    {
        $check = Check::findOrFail($id);

        $validated = $request->validate([
            'type'                 => 'sometimes|in:received,given',
            'document_type'        => 'nullable|in:check,note',
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
            'attachment'           => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        if ($request->hasFile('attachment')) {
            if ($check->attachment_path) {
                Storage::disk('public')->delete($check->attachment_path);
            }
            $validated['attachment_path'] = $request->file('attachment')->store('checks', 'public');
        }

        unset($validated['attachment']);
        $check->update($validated);

        $fresh = $check->fresh(['accountingAccount', 'invoice', 'creator']);
        if ($fresh->attachment_path) {
            $fresh->attachment_url = Storage::url($fresh->attachment_path);
        }

        return response()->json([
            'message' => 'Güncellendi.',
            'data'    => $fresh,
        ]);
    }

    public function destroy(string $id)
    {
        $check = Check::findOrFail($id);
        if ($check->attachment_path) {
            Storage::disk('public')->delete($check->attachment_path);
        }
        $check->delete();
        return response()->json(['message' => 'Silindi.']);
    }

    public function copy(Request $request, string $id)
    {
        $original = Check::findOrFail($id);

        $copy = Check::create([
            'project_id'    => $original->project_id,
            'type'          => $original->type,
            'document_type' => $original->document_type,
            'check_no'      => $original->check_no ? $original->check_no . '-kopya' : null,
            'amount'        => $original->amount,
            'issue_date'    => $original->issue_date,
            'due_date'      => $original->due_date,
            'bank_name'     => $original->bank_name,
            'branch'        => $original->branch,
            'counterparty'  => $original->counterparty,
            'description'   => $original->description,
            'status'        => 'pending',
            'created_by'    => $request->user()->id,
        ]);

        $today = Carbon::today();
        $copy->days_until_due = $today->diffInDays(Carbon::parse($copy->due_date), false);

        return response()->json([
            'message' => 'Kopya oluşturuldu.',
            'data'    => $copy->load(['accountingAccount', 'invoice', 'creator']),
        ], 201);
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
