<?php

namespace App\Http\Controllers;

use App\Models\AccountingAccount;
use Illuminate\Http\Request;

class AccountingAccountController extends Controller
{
    public function index(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;

        $query = AccountingAccount::where('project_id', $projectId);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('tax_number', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%");
            });
        }

        $accounts = $query->orderBy('name')->get();

        return response()->json(['data' => $accounts]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'active_project_id' => 'required|exists:projects,id',
            'type'       => 'required|in:customer,supplier,both',
            'name'       => 'required|string|max:255',
            'tax_number' => 'nullable|string|max:50',
            'tax_office' => 'nullable|string|max:255',
            'phone'      => 'nullable|string|max:30',
            'email'      => 'nullable|email|max:255',
            'address'    => 'nullable|string',
            'city'       => 'nullable|string|max:100',
            'category'   => 'nullable|string|max:100',
            'group'      => 'nullable|string|max:100',
            'notes'      => 'nullable|string',
        ]);

        $account = AccountingAccount::create([
            ...$validated,
            'project_id' => $validated['active_project_id'],
        ]);

        return response()->json(['message' => 'Cari hesap oluşturuldu.', 'data' => $account], 201);
    }

    public function show(string $id)
    {
        $account = AccountingAccount::with(['invoices.items', 'payments'])->findOrFail($id);
        return response()->json(['data' => $account]);
    }

    public function update(Request $request, string $id)
    {
        $account = AccountingAccount::findOrFail($id);

        $validated = $request->validate([
            'type'       => 'sometimes|in:customer,supplier,both',
            'name'       => 'sometimes|required|string|max:255',
            'tax_number' => 'nullable|string|max:50',
            'tax_office' => 'nullable|string|max:255',
            'phone'      => 'nullable|string|max:30',
            'email'      => 'nullable|email|max:255',
            'address'    => 'nullable|string',
            'city'       => 'nullable|string|max:100',
            'category'   => 'nullable|string|max:100',
            'group'      => 'nullable|string|max:100',
            'status'     => 'sometimes|in:active,passive',
            'notes'      => 'nullable|string',
        ]);

        $account->update($validated);

        return response()->json(['message' => 'Güncellendi.', 'data' => $account]);
    }

    public function destroy(string $id)
    {
        $account = AccountingAccount::findOrFail($id);
        $account->delete();
        return response()->json(['message' => 'Cari hesap silindi.']);
    }
}
