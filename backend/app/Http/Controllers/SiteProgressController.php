<?php

namespace App\Http\Controllers;

use App\Models\SiteProgressItem;
use App\Models\Block;
use Illuminate\Http\Request;

class SiteProgressController extends Controller
{
    public function index(Request $request)
    {
        $pid = $request->input('active_project_id');

        $blocks = Block::where('project_id', $pid)
            ->with(['units' => fn($q) => $q->select('id', 'block_id', 'status')])
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $items = SiteProgressItem::where('project_id', $pid)
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return response()->json([
            'blocks' => $blocks,
            'items'  => $items,
        ]);
    }

    public function store(Request $request)
    {
        $pid = $request->input('active_project_id');
        $data = $request->validate([
            'block_id' => 'nullable|exists:blocks,id',
            'name'     => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'progress' => 'required|integer|min:0|max:100',
            'note'     => 'nullable|string',
        ]);

        $item = SiteProgressItem::create(array_merge($data, ['project_id' => $pid]));

        return response()->json(['data' => $item], 201);
    }

    public function update(Request $request, string $id)
    {
        $item = SiteProgressItem::findOrFail($id);
        $data = $request->validate([
            'block_id' => 'nullable|exists:blocks,id',
            'name'     => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:100',
            'progress' => 'sometimes|integer|min:0|max:100',
            'note'     => 'nullable|string',
        ]);

        $item->update($data);

        return response()->json(['data' => $item]);
    }

    public function destroy(string $id)
    {
        SiteProgressItem::findOrFail($id)->delete();
        return response()->json(['message' => 'Silindi.']);
    }
}
