<?php

namespace App\Http\Controllers;

use App\Models\StockItem;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class StockController extends Controller
{
    // ─── Warehouses ───────────────────────────────────────────────────────────

    public function warehouses(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;
        $warehouses = Warehouse::where('project_id', $projectId)->orderBy('name')->get();
        return response()->json(['data' => $warehouses]);
    }

    public function storeWarehouse(Request $request)
    {
        $validated = $request->validate([
            'active_project_id' => 'required|exists:projects,id',
            'name'              => 'required|string|max:100',
            'location'          => 'nullable|string|max:255',
            'description'       => 'nullable|string',
            'is_active'         => 'nullable|boolean',
        ]);
        $wh = Warehouse::create([
            ...$validated,
            'project_id' => $validated['active_project_id'],
            'created_by' => $request->user()->id,
        ]);
        return response()->json(['message' => 'Depo oluşturuldu.', 'data' => $wh], 201);
    }

    public function updateWarehouse(Request $request, string $id)
    {
        $wh = Warehouse::findOrFail($id);
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'location'    => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active'   => 'nullable|boolean',
        ]);
        $wh->update($validated);
        return response()->json(['message' => 'Depo güncellendi.', 'data' => $wh->fresh()]);
    }

    public function destroyWarehouse(string $id)
    {
        Warehouse::findOrFail($id)->delete();
        return response()->json(['message' => 'Depo silindi.']);
    }

    // ─── Stock Items ──────────────────────────────────────────────────────────

    public function items(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;

        $query = StockItem::where('project_id', $projectId);
        if ($request->filled('category')) $query->where('category', $request->category);
        if ($request->filled('search'))   $query->where(function($q) use ($request) {
            $q->where('name', 'ilike', '%' . $request->search . '%')
              ->orWhere('code', 'ilike', '%' . $request->search . '%');
        });

        $items = $query->orderBy('name')->get();

        // Append current stock per item
        $movSums = StockMovement::where('project_id', $projectId)
            ->selectRaw('stock_item_id,
                SUM(CASE WHEN type IN (\'in\', \'adjustment\') THEN quantity ELSE 0 END) as total_in,
                SUM(CASE WHEN type = \'out\' THEN quantity ELSE 0 END) as total_out')
            ->groupBy('stock_item_id')
            ->get()->keyBy('stock_item_id');

        $items->each(function ($item) use ($movSums) {
            $s = $movSums[$item->id] ?? null;
            $item->total_in      = (float) ($s->total_in ?? 0);
            $item->total_out     = (float) ($s->total_out ?? 0);
            $item->current_stock = $item->total_in - $item->total_out;
            $item->is_low_stock  = $item->current_stock <= $item->min_quantity && $item->min_quantity > 0;
        });

        return response()->json(['data' => $items]);
    }

    public function storeItem(Request $request)
    {
        $validated = $request->validate([
            'active_project_id' => 'required|exists:projects,id',
            'name'              => 'required|string|max:150',
            'code'              => 'nullable|string|max:50',
            'category'          => 'nullable|string|max:100',
            'unit'              => 'nullable|string|max:20',
            'min_quantity'      => 'nullable|numeric|min:0',
            'unit_price'        => 'nullable|numeric|min:0',
            'description'       => 'nullable|string',
        ]);
        $item = StockItem::create([
            ...$validated,
            'project_id' => $validated['active_project_id'],
            'unit'       => $validated['unit'] ?? 'adet',
            'created_by' => $request->user()->id,
        ]);
        return response()->json(['message' => 'Stok kalemi oluşturuldu.', 'data' => $item], 201);
    }

    public function updateItem(Request $request, string $id)
    {
        $item = StockItem::findOrFail($id);
        $validated = $request->validate([
            'name'         => 'sometimes|string|max:150',
            'code'         => 'nullable|string|max:50',
            'category'     => 'nullable|string|max:100',
            'unit'         => 'nullable|string|max:20',
            'min_quantity' => 'nullable|numeric|min:0',
            'unit_price'   => 'nullable|numeric|min:0',
            'description'  => 'nullable|string',
        ]);
        $item->update($validated);
        return response()->json(['message' => 'Stok kalemi güncellendi.', 'data' => $item->fresh()]);
    }

    public function destroyItem(string $id)
    {
        StockItem::findOrFail($id)->delete();
        return response()->json(['message' => 'Stok kalemi silindi.']);
    }

    // ─── Movements ────────────────────────────────────────────────────────────

    public function movements(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;

        $query = StockMovement::with(['stockItem', 'warehouse', 'creator'])
            ->where('project_id', $projectId);

        if ($request->filled('stock_item_id')) $query->where('stock_item_id', $request->stock_item_id);
        if ($request->filled('warehouse_id'))  $query->where('warehouse_id', $request->warehouse_id);
        if ($request->filled('type'))          $query->where('type', $request->type);
        if ($request->filled('date_from'))     $query->whereDate('date', '>=', $request->date_from);
        if ($request->filled('date_to'))       $query->whereDate('date', '<=', $request->date_to);

        $movements = $query->orderByDesc('date')->orderByDesc('id')->paginate(50);
        return response()->json($movements);
    }

    public function storeMovement(Request $request)
    {
        $validated = $request->validate([
            'active_project_id' => 'required|exists:projects,id',
            'stock_item_id'     => 'required|exists:stock_items,id',
            'warehouse_id'      => 'nullable|exists:warehouses,id',
            'type'              => 'required|in:in,out,transfer,adjustment',
            'quantity'          => 'required|numeric|min:0.001',
            'unit_price'        => 'nullable|numeric|min:0',
            'date'              => 'required|date',
            'reference_no'      => 'nullable|string|max:100',
            'supplier'          => 'nullable|string|max:150',
            'description'       => 'nullable|string',
        ]);

        $totalPrice = isset($validated['unit_price'])
            ? $validated['quantity'] * $validated['unit_price']
            : null;

        $movement = StockMovement::create([
            ...$validated,
            'project_id'  => $validated['active_project_id'],
            'total_price' => $totalPrice,
            'created_by'  => $request->user()->id,
        ]);

        // Update item's unit_price if provided
        if (isset($validated['unit_price']) && $validated['type'] === 'in') {
            StockItem::where('id', $validated['stock_item_id'])
                ->update(['unit_price' => $validated['unit_price']]);
        }

        return response()->json([
            'message' => 'Hareket eklendi.',
            'data'    => $movement->load(['stockItem', 'warehouse']),
        ], 201);
    }

    public function updateMovement(Request $request, string $id)
    {
        $movement = StockMovement::findOrFail($id);
        $validated = $request->validate([
            'type'         => 'sometimes|in:in,out,transfer,adjustment',
            'quantity'     => 'sometimes|numeric|min:0.001',
            'unit_price'   => 'nullable|numeric|min:0',
            'date'         => 'sometimes|date',
            'reference_no' => 'nullable|string|max:100',
            'supplier'     => 'nullable|string|max:150',
            'description'  => 'nullable|string',
            'warehouse_id' => 'nullable|exists:warehouses,id',
        ]);

        if (isset($validated['unit_price']) && isset($validated['quantity'])) {
            $validated['total_price'] = $validated['quantity'] * $validated['unit_price'];
        }

        $movement->update($validated);
        return response()->json(['message' => 'Hareket güncellendi.', 'data' => $movement->fresh()]);
    }

    public function destroyMovement(string $id)
    {
        StockMovement::findOrFail($id)->delete();
        return response()->json(['message' => 'Hareket silindi.']);
    }

    // ─── Summary ──────────────────────────────────────────────────────────────

    public function summary(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;
        $today  = Carbon::today();
        $month  = Carbon::now()->startOfMonth();

        $items = StockItem::where('project_id', $projectId)->get();
        $itemCount = $items->count();

        $movSums = StockMovement::where('project_id', $projectId)
            ->selectRaw('stock_item_id,
                SUM(CASE WHEN type IN (\'in\',\'adjustment\') THEN quantity ELSE 0 END) as total_in,
                SUM(CASE WHEN type = \'out\' THEN quantity ELSE 0 END) as total_out')
            ->groupBy('stock_item_id')
            ->get()->keyBy('stock_item_id');

        $lowStockCount = 0;
        $totalStockValue = 0;
        foreach ($items as $item) {
            $s = $movSums[$item->id] ?? null;
            $cur = (float)($s->total_in ?? 0) - (float)($s->total_out ?? 0);
            if ($item->min_quantity > 0 && $cur <= $item->min_quantity) $lowStockCount++;
            if ($item->unit_price) $totalStockValue += $cur * $item->unit_price;
        }

        $monthIn  = StockMovement::where('project_id', $projectId)
            ->whereIn('type', ['in', 'adjustment'])->where('date', '>=', $month)->sum('total_price');
        $monthOut = StockMovement::where('project_id', $projectId)
            ->where('type', 'out')->where('date', '>=', $month)->sum('total_price');

        return response()->json(['data' => [
            'item_count'        => $itemCount,
            'low_stock_count'   => $lowStockCount,
            'total_stock_value' => round($totalStockValue, 2),
            'month_in_value'    => round((float)$monthIn, 2),
            'month_out_value'   => round((float)$monthOut, 2),
        ]]);
    }

    // ─── Categories ───────────────────────────────────────────────────────────

    public function categories(Request $request)
    {
        $projectId = $request->header('Active-Project-Id') ?? $request->active_project_id;
        $cats = StockItem::where('project_id', $projectId)
            ->whereNotNull('category')->distinct()->pluck('category')->sort()->values();
        return response()->json(['data' => $cats]);
    }
}
