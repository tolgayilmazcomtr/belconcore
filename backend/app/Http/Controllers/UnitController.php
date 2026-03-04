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

        // Aynı unit_no ile silinmiş kayıt varsa restore edip güncelle
        $trashedQuery = \App\Models\Unit::onlyTrashed()
            ->where('project_id', $validated['project_id'])
            ->where('unit_no', $validated['unit_no']);
        if (!empty($validated['block_id'])) {
            $trashedQuery->where('block_id', $validated['block_id']);
        } else {
            $trashedQuery->whereNull('block_id');
        }
        $trashed = $trashedQuery->first();
        if ($trashed) {
            $trashed->restore();
            $trashed->update($validated);
            return response()->json(['message' => 'Ünite yeniden aktif edildi.', 'data' => $trashed], 200);
        }

        // Normal duplicate kontrol
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

    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'units' => 'required|array|min:1',
            'units.*.block_id' => 'nullable|exists:blocks,id',
            'units.*.unit_no' => 'required|string|max:50',
            'units.*.floor_no' => 'nullable|string|max:50',
            'units.*.unit_type' => 'required|string|max:50',
            'units.*.gross_area' => 'nullable|numeric|min:0',
            'units.*.net_area' => 'nullable|numeric|min:0',
            'units.*.status' => 'required|in:available,reserved,sold,not_for_sale',
            'units.*.list_price' => 'nullable|numeric|min:0',
        ]);

        $projectId = $request->active_project_id;
        $createdUnits = [];

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            foreach ($validated['units'] as $unitData) {
                $unitData['project_id'] = $projectId;

                // Önce silinmiş halde aynı kayıt var mı kontrol et
                $trashedQuery = \App\Models\Unit::onlyTrashed()
                    ->where('project_id', $projectId)
                    ->where('unit_no', $unitData['unit_no']);
                if (!empty($unitData['block_id'])) {
                    $trashedQuery->where('block_id', $unitData['block_id']);
                } else {
                    $trashedQuery->whereNull('block_id');
                }
                $trashed = $trashedQuery->first();
                if ($trashed) {
                    $trashed->restore();
                    $trashed->update($unitData);
                    $createdUnits[] = $trashed->load('block');
                    continue;
                }

                // Normal kontrol: zaten aktif olan bir kayıt var mı?
                $existsQuery = \App\Models\Unit::where('project_id', $projectId)
                    ->where('unit_no', $unitData['unit_no']);
                if (!empty($unitData['block_id'])) {
                    $existsQuery->where('block_id', $unitData['block_id']);
                } else {
                    $existsQuery->whereNull('block_id');
                }
                if ($existsQuery->exists()) {
                    \Illuminate\Support\Facades\DB::rollBack();
                    return response()->json(['message' => "{$unitData['unit_no']} numaralı ünite kodu (Kapı No) projede zaten mevcut. Lütfen eşsiz olduğundan emin olun."], 422);
                }

                $unit = \App\Models\Unit::create($unitData);
                $createdUnits[] = $unit->load('block');
            }
            \Illuminate\Support\Facades\DB::commit();
            return response()->json(['message' => count($createdUnits) . ' adet ünite başarıyla oluşturuldu.', 'data' => $createdUnits], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Toplu kayıt sırasında bir sunucu hatası oluştu: ' . $e->getMessage()], 500);
        }
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
