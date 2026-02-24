<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BlockController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $blocks = \App\Models\Block::where('project_id', $request->active_project_id)
            ->withCount('units')
            ->get();

        return response()->json($blocks);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'parcel_island' => 'nullable|string|max:100',
        ]);

        $validated['project_id'] = $request->active_project_id;

        if ($validated['code'] && \App\Models\Block::where('project_id', $validated['project_id'])->where('code', $validated['code'])->exists()) {
            return response()->json(['message' => 'Bu blok kodu seçili projede zaten mevcut.'], 422);
        }

        $block = \App\Models\Block::create($validated);
        return response()->json(['message' => 'Blok başarıyla oluşturuldu.', 'data' => $block], 201);
    }

    public function show(string $id)
    {
        $block = \App\Models\Block::with('units')->findOrFail($id);
        return response()->json($block);
    }

    public function update(Request $request, string $id)
    {
        $block = \App\Models\Block::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'parcel_island' => 'nullable|string|max:100',
        ]);

        if ($validated['code'] && \App\Models\Block::where('project_id', $block->project_id)->where('code', $validated['code'])->where('id', '!=', $block->id)->exists()) {
            return response()->json(['message' => 'Bu blok kodu seçili projede zaten mevcut.'], 422);
        }

        $block->update($validated);
        return response()->json(['message' => 'Blok güncellendi.', 'data' => $block]);
    }

    public function destroy(string $id)
    {
        $block = \App\Models\Block::findOrFail($id);
        $block->delete();
        return response()->json(['message' => 'Blok başarıyla silindi.']);
    }
}
