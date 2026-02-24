<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $projects = $user->hasRole('Admin') 
            ? \App\Models\Project::latest()->paginate(20)
            : $user->projects()->latest()->paginate(20);

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:projects',
            'code' => 'nullable|string|max:50|unique:projects',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'planned_budget' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:planned,active,completed,suspended'
        ]);

        $project = \App\Models\Project::create($validated);
        
        // Projeyi oluşturan personalar otomatik olarak bu projeye atanır
        $request->user()->projects()->attach($project->id);

        return response()->json(['message' => 'Proje başarıyla oluşturuldu.', 'data' => $project], 201);
    }

    public function show(string $id)
    {
        $project = \App\Models\Project::with(['blocks', 'units'])->findOrFail($id);
        return response()->json($project);
    }

    public function update(Request $request, string $id)
    {
        $project = \App\Models\Project::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:projects,name,' . $project->id,
            'code' => 'nullable|string|max:50|unique:projects,code,' . $project->id,
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'planned_budget' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:planned,active,completed,suspended'
        ]);

        $project->update($validated);

        return response()->json(['message' => 'Proje başarıyla güncellendi.', 'data' => $project]);
    }

    public function destroy(string $id)
    {
        $project = \App\Models\Project::findOrFail($id);
        $project->delete();

        return response()->json(['message' => 'Proje başarıyla silindi.']);
    }
}
