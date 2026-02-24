<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UnitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\Unit::where('project_id', $request->active_project_id)->with('block');

        // Opsiyonel olarak block_id ile filtreleme yapılabilir
        if ($request->has('block_id')) {
            $query->where('block_id', $request->block_id);
        }

        return response()->json($query->paginate(30));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'block_id' => 'nullable|exists:blocks,id',
            'unit_no' => 'required|string|max:50',
            'floor_no' => 'nullable|string|max:50',
            'unit_type' => 'required|string|max:50',
            'gross_area' => 'nullable|numeric|min:0',
            'net_area' => 'nullable|numeric|min:0',
            'status' => 'required|in:available,reserved,sold,not_for_sale',
            'list_price' => 'nullable|numeric|min:0',
        ]);

        $validated['project_id'] = $request->active_project_id;

        // Benzersiz ünite numarası kontrolü (Proje + Blok bazında)
        $existsQuery = \App\Models\Unit::where('project_id', $validated['project_id'])
            ->where('unit_no', $validated['unit_no']);
        
        if (!empty($validated['block_id'])) {
            $existsQuery->where('block_id', $validated['block_id']);
        } else {
            $existsQuery->whereNull('block_id');
        }

        if ($existsQuery->exists()) {
            return response()->json(['message' => 'Bu ünite numarası seçili blokta zaten mevcut.'], 422);
        }

        $unit = \App\Models\Unit::create($validated);
        return response()->json(['message' => 'Ünite başarıyla oluşturuldu.', 'data' => $unit], 201);
    }

    public function show(string $id)
    {
        $unit = \App\Models\Unit::with('block')->findOrFail($id);
        return response()->json($unit);
    }

    public function update(Request $request, string $id)
    {
        $unit = \App\Models\Unit::findOrFail($id);
        
        $validated = $request->validate([
            'block_id' => 'nullable|exists:blocks,id',
            'unit_no' => 'required|string|max:50',
            'floor_no' => 'nullable|string|max:50',
            'unit_type' => 'required|string|max:50',
            'gross_area' => 'nullable|numeric|min:0',
            'net_area' => 'nullable|numeric|min:0',
            'status' => 'required|in:available,reserved,sold,not_for_sale',
            'list_price' => 'nullable|numeric|min:0',
        ]);

        if ($validated['block_id'] !== $unit->block_id || $validated['unit_no'] !== $unit->unit_no) {
             $existsQuery = \App\Models\Unit::where('project_id', $unit->project_id)
                ->where('unit_no', $validated['unit_no'])
                ->where('id', '!=', $unit->id);

            if (!empty($validated['block_id'])) {
                $existsQuery->where('block_id', $validated['block_id']);
            } else {
                $existsQuery->whereNull('block_id');
            }

            if ($existsQuery->exists()) {
                return response()->json(['message' => 'Bu ünite numarası seçili blokta zaten mevcut.'], 422);
            }
        }

        $unit->update($validated);
        return response()->json(['message' => 'Ünite güncellendi.', 'data' => $unit]);
    }

    public function destroy(string $id)
    {
        $unit = \App\Models\Unit::findOrFail($id);
        $unit->delete();
        return response()->json(['message' => 'Ünite başarıyla silindi.']);
    }
}
