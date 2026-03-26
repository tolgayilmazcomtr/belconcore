<?php

namespace App\Http\Controllers;

use App\Models\CostItem;
use App\Models\CostSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CostItemController extends Controller
{
    // ── Items ─────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;

        $query = CostItem::where('project_id', $projectId);

        if ($request->filled('category')) $query->where('category', $request->category);
        if ($request->filled('status') && $request->status !== 'all') $query->where('status', $request->status);
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('contractor', 'like', "%{$s}%")
                  ->orWhere('category', 'like', "%{$s}%");
            });
        }

        $items = $query->orderBy('sort_order')->orderBy('id')->get();
        return response()->json(['data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'active_project_id'  => 'required|exists:projects,id',
            'name'               => 'required|string|max:255',
            'category'           => 'nullable|string|max:100',
            'quantity'           => 'nullable|numeric|min:0',
            'unit'               => 'nullable|string|max:50',
            'planned_unit_price' => 'nullable|numeric|min:0',
            'planned_total'      => 'nullable|numeric|min:0',
            'actual_unit_price'  => 'nullable|numeric|min:0',
            'actual_total'       => 'nullable|numeric|min:0',
            'contractor'         => 'nullable|string|max:255',
            'contract_date'      => 'nullable|date',
            'status'             => 'nullable|in:planned,contracted,in_progress,completed,cancelled',
            'notes'              => 'nullable|string',
            'sort_order'         => 'nullable|integer',
        ]);

        // Auto-calculate planned_total if not provided
        if (empty($validated['planned_total']) && !empty($validated['quantity']) && !empty($validated['planned_unit_price'])) {
            $validated['planned_total'] = $validated['quantity'] * $validated['planned_unit_price'];
        }
        // Auto-calculate actual_total if not provided
        if (empty($validated['actual_total']) && !empty($validated['quantity']) && !empty($validated['actual_unit_price'])) {
            $validated['actual_total'] = $validated['quantity'] * $validated['actual_unit_price'];
        }

        $item = CostItem::create([
            ...$validated,
            'project_id' => $validated['active_project_id'],
            'created_by' => $request->user()?->id,
        ]);

        return response()->json(['message' => 'İmalat eklendi.', 'data' => $item], 201);
    }

    public function update(Request $request, string $id)
    {
        $item = CostItem::findOrFail($id);

        $validated = $request->validate([
            'name'               => 'sometimes|string|max:255',
            'category'           => 'nullable|string|max:100',
            'quantity'           => 'nullable|numeric|min:0',
            'unit'               => 'nullable|string|max:50',
            'planned_unit_price' => 'nullable|numeric|min:0',
            'planned_total'      => 'nullable|numeric|min:0',
            'actual_unit_price'  => 'nullable|numeric|min:0',
            'actual_total'       => 'nullable|numeric|min:0',
            'contractor'         => 'nullable|string|max:255',
            'contract_date'      => 'nullable|date',
            'status'             => 'nullable|in:planned,contracted,in_progress,completed,cancelled',
            'notes'              => 'nullable|string',
            'sort_order'         => 'nullable|integer',
        ]);

        // Auto-calculate totals when unit price changes
        $qty = $validated['quantity'] ?? $item->quantity;
        if (isset($validated['planned_unit_price']) && $qty && !isset($validated['planned_total'])) {
            $validated['planned_total'] = $qty * $validated['planned_unit_price'];
        }
        if (isset($validated['actual_unit_price']) && $qty && !isset($validated['actual_total'])) {
            $validated['actual_total'] = $qty * $validated['actual_unit_price'];
        }

        $item->update($validated);
        return response()->json(['message' => 'Güncellendi.', 'data' => $item->fresh()]);
    }

    public function destroy(string $id)
    {
        CostItem::findOrFail($id)->delete();
        return response()->json(['message' => 'İmalat silindi.']);
    }

    // ── Bulk reorder ─────────────────────────────────────────────────────────

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'items'    => 'required|array',
            'items.*'  => 'integer|exists:cost_items,id',
        ]);
        DB::transaction(function () use ($validated) {
            foreach ($validated['items'] as $i => $id) {
                CostItem::where('id', $id)->update(['sort_order' => $i]);
            }
        });
        return response()->json(['message' => 'Sıralama güncellendi.']);
    }

    // ── Settings ─────────────────────────────────────────────────────────────

    public function getSettings(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;
        $settings = CostSetting::firstOrCreate(
            ['project_id' => $projectId],
            ['unit_count' => 1, 'currency' => 'TRY']
        );
        return response()->json(['data' => $settings]);
    }

    public function updateSettings(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;
        $validated = $request->validate([
            'unit_count' => 'required|integer|min:1',
            'currency'   => 'nullable|string|max:10',
            'notes'      => 'nullable|string',
        ]);
        $settings = CostSetting::updateOrCreate(
            ['project_id' => $projectId],
            $validated
        );
        return response()->json(['message' => 'Ayarlar kaydedildi.', 'data' => $settings]);
    }

    // ── Summary ──────────────────────────────────────────────────────────────

    public function summary(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;

        $items = CostItem::where('project_id', $projectId)->get();
        $settings = CostSetting::where('project_id', $projectId)->first();

        $totalPlanned   = $items->sum('planned_total');
        // Gerçek toplam: sadece actual_total girilen kalemlerin toplamı
        $totalActual    = $items->whereNotNull('actual_total')->sum('actual_total');
        // Karma tahmin: actual_total varsa onu, yoksa planned_total kullan → en güncel maliyet tahmini
        $blendedTotal   = $items->sum(fn($i) => $i->actual_total ?? $i->planned_total ?? 0);
        $unitCount      = $settings?->unit_count ?? 1;
        $plannedPerUnit = $unitCount > 0 ? $totalPlanned / $unitCount : 0;
        $actualPerUnit  = $unitCount > 0 ? $blendedTotal / $unitCount : 0;
        $variance       = $blendedTotal - $totalPlanned;
        $completedCount = $items->where('status', 'contracted')->count()
                        + $items->where('status', 'in_progress')->count()
                        + $items->where('status', 'completed')->count();

        $contractedCount = $items->whereNotNull('actual_total')->count();

        return response()->json([
            'data' => [
                'total_planned'     => $totalPlanned,
                'total_actual'      => $totalActual,      // sadece gerçek fiyat girilenlerin toplamı
                'blended_total'     => $blendedTotal,     // gerçek + kalan planlanan = güncel tahmin
                'variance'          => $variance,
                'unit_count'        => $unitCount,
                'planned_per_unit'  => $plannedPerUnit,
                'actual_per_unit'   => $actualPerUnit,    // blended / unit_count
                'total_items'       => $items->count(),
                'completed_count'   => $completedCount,
                'contracted_count'  => $contractedCount,
            ]
        ]);
    }
}
