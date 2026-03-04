<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SceneLabel;

class SceneLabelController extends Controller
{
    public function index(Request $request)
    {
        $labels = SceneLabel::where('project_id', $request->active_project_id)->get();
        return response()->json($labels);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'text'     => 'required|string|max:100',
            'x'        => 'nullable|numeric',
            'z'        => 'nullable|numeric',
            'rotation' => 'nullable|numeric',
            'color'    => 'nullable|string|max:20',
            'scale'    => 'nullable|numeric|min:0.1|max:10',
        ]);

        $validated['project_id'] = $request->active_project_id;
        $label = SceneLabel::create($validated);
        return response()->json($label, 201);
    }

    public function update(Request $request, SceneLabel $sceneLabel)
    {
        $validated = $request->validate([
            'text'     => 'required|string|max:100',
            'x'        => 'nullable|numeric',
            'z'        => 'nullable|numeric',
            'rotation' => 'nullable|numeric',
            'color'    => 'nullable|string|max:20',
            'scale'    => 'nullable|numeric|min:0.1|max:10',
        ]);

        $sceneLabel->update($validated);
        return response()->json($sceneLabel);
    }

    public function destroy(SceneLabel $sceneLabel)
    {
        $sceneLabel->delete();
        return response()->json(['message' => 'Silindi']);
    }
}
