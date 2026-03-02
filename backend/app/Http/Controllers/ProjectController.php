<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = \App\Models\Project::withCount(['blocks', 'units']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status !== 'all' && $request->status !== '') {
            $query->where('status', $request->status);
        }

        if (!$user->hasRole('Admin')) {
            $query->whereHas('users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }

        $projects = $query->latest()->paginate(20);

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
            'status' => 'nullable|in:planned,active,completed,suspended',
        ]);

        $project = \App\Models\Project::create($validated);
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
            'status' => 'nullable|in:planned,active,completed,suspended',
            'company_name' => 'nullable|string|max:255',
            'company_phone' => 'nullable|string|max:50',
            'company_email' => 'nullable|email|max:255',
            'company_address' => 'nullable|string',
            'company_website' => 'nullable|string|max:255',
            'tax_office' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:50',
        ]);

        $project->update($validated);

        return response()->json(['message' => 'Proje başarıyla güncellendi.', 'data' => $project]);
    }

    public function uploadLogo(Request $request, string $id)
    {
        $request->validate([
            // 'image' rule rejects SVG — use 'file|mimes:' for broader support
            'logo' => 'required|file|mimes:jpeg,png,jpg,gif,svg,webp|max:4096',
        ]);

        $project = \App\Models\Project::findOrFail($id);

        // Delete previous logo if it exists
        if ($project->logo_path && Storage::disk('public')->exists($project->logo_path)) {
            Storage::disk('public')->delete($project->logo_path);
        }

        $path = $request->file('logo')->store('logos', 'public');
        $project->update(['logo_path' => $path]);

        // Build absolute URL so the browser can display it
        $logoUrl = url(Storage::url($path));

        return response()->json([
            'message'  => 'Logo yüklendi.',
            'logo_url' => $logoUrl,
            'data'     => $project,
        ]);
    }

    public function destroy(string $id)
    {
        $project = \App\Models\Project::findOrFail($id);
        $project->delete();

        return response()->json(['message' => 'Proje başarıyla silindi.']);
    }
}
