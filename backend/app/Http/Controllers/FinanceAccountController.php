<?php

namespace App\Http\Controllers;

use App\Models\FinanceAccount;
use App\Models\FinanceTransaction;
use Illuminate\Http\Request;

class FinanceAccountController extends Controller
{
    // ── Accounts ──────────────────────────────────────────────────────────────

    public function indexAccounts(Request $request)
    {
        $projectId = $request->input('active_project_id');
        $accounts = FinanceAccount::where('project_id', $projectId)
            ->when($request->type, fn($q, $v) => $q->where('type', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('type')->orderBy('name')
            ->get();

        return response()->json(['data' => $accounts]);
    }

    public function storeAccount(Request $request)
    {
        $data = $request->validate([
            'active_project_id' => 'required|integer|exists:projects,id',
            'type'              => 'required|in:cash,bank',
            'name'              => 'required|string|max:255',
            'bank_name'         => 'nullable|string|max:255',
            'branch'            => 'nullable|string|max:255',
            'account_no'        => 'nullable|string|max:100',
            'iban'              => 'nullable|string|max:34',
            'currency'          => 'nullable|string|max:10',
            'opening_balance'   => 'nullable|numeric',
            'is_default'        => 'nullable|boolean',
            'notes'             => 'nullable|string',
        ]);

        $account = FinanceAccount::create([
            ...$data,
            'project_id' => $data['active_project_id'],
            'balance'    => $data['opening_balance'] ?? 0,
        ]);

        return response()->json(['data' => $account], 201);
    }

    public function updateAccount(Request $request, FinanceAccount $account)
    {
        $data = $request->validate([
            'type'            => 'sometimes|in:cash,bank',
            'name'            => 'sometimes|string|max:255',
            'bank_name'       => 'nullable|string|max:255',
            'branch'          => 'nullable|string|max:255',
            'account_no'      => 'nullable|string|max:100',
            'iban'            => 'nullable|string|max:34',
            'currency'        => 'nullable|string|max:10',
            'opening_balance' => 'nullable|numeric',
            'is_default'      => 'nullable|boolean',
            'status'          => 'nullable|in:active,passive',
            'notes'           => 'nullable|string',
        ]);

        $account->update($data);

        if (isset($data['opening_balance'])) {
            $account->recalculate();
            $account->refresh();
        }

        return response()->json(['data' => $account]);
    }

    public function destroyAccount(FinanceAccount $account)
    {
        $account->delete();
        return response()->json(['message' => 'Silindi.']);
    }

    // ── Transactions ──────────────────────────────────────────────────────────

    public function indexTransactions(Request $request)
    {
        $projectId = $request->input('active_project_id');

        $query = FinanceTransaction::with('account', 'transferTo')
            ->where('project_id', $projectId);

        if ($request->account_id) {
            $toId = (int) $request->account_id;
            $query->where(function ($q) use ($toId) {
                $q->where('account_id', $toId)
                  ->orWhere('transfer_to_account_id', $toId);
            });
        }

        if ($request->type && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->date_from) $query->whereDate('date', '>=', $request->date_from);
        if ($request->date_to)   $query->whereDate('date', '<=', $request->date_to);

        $transactions = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->get();

        return response()->json(['data' => $transactions]);
    }

    public function storeTransaction(Request $request)
    {
        $data = $request->validate([
            'active_project_id'      => 'required|integer|exists:projects,id',
            'account_id'             => 'required|integer|exists:finance_accounts,id',
            'transfer_to_account_id' => 'nullable|integer|exists:finance_accounts,id|different:account_id',
            'type'                   => 'required|in:income,expense,transfer',
            'amount'                 => 'required|numeric|min:0.01',
            'date'                   => 'required|date',
            'description'            => 'nullable|string|max:255',
            'category'               => 'nullable|string|max:100',
            'reference'              => 'nullable|string|max:100',
        ]);

        if ($data['type'] === 'transfer' && empty($data['transfer_to_account_id'])) {
            return response()->json(['message' => 'Transfer için hedef hesap seçilmelidir.'], 422);
        }

        $tx = FinanceTransaction::create([
            ...$data,
            'project_id' => $data['active_project_id'],
            'created_by' => auth()->id(),
        ]);

        // Recalculate affected accounts
        $tx->account->recalculate();
        if ($tx->transfer_to_account_id) {
            $tx->transferTo->recalculate();
        }

        return response()->json(['data' => $tx->load('account', 'transferTo')], 201);
    }

    public function destroyTransaction(FinanceTransaction $transaction)
    {
        $accountId = $transaction->account_id;
        $transferToId = $transaction->transfer_to_account_id;
        $transaction->delete();

        FinanceAccount::find($accountId)?->recalculate();
        if ($transferToId) FinanceAccount::find($transferToId)?->recalculate();

        return response()->json(['message' => 'Hareket silindi.']);
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    public function summary(Request $request)
    {
        $projectId = $request->input('active_project_id');
        $accounts = FinanceAccount::where('project_id', $projectId)->where('status', 'active')->get();

        return response()->json([
            'data' => [
                'total_balance' => $accounts->sum('balance'),
                'cash_balance'  => $accounts->where('type', 'cash')->sum('balance'),
                'bank_balance'  => $accounts->where('type', 'bank')->sum('balance'),
                'accounts'      => $accounts,
            ]
        ]);
    }
}
