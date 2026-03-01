<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Http\Resources\ActivityResource;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['lead_id' => 'required|exists:leads,id']);
        
        $activities = Activity::with('user')
            ->where('lead_id', $request->query('lead_id'))
            ->orderBy('created_at', 'desc')
            ->get();

        return ActivityResource::collection($activities);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'type' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
            'is_completed' => 'nullable|boolean',
        ]);

        $data['project_id'] = $request->active_project_id;
        $data['user_id'] = $request->user()->id;

        $activity = Activity::create($data);
        $activity->load('user');

        return new ActivityResource($activity);
    }

    public function update(Request $request, Activity $activity)
    {
        $data = $request->validate([
            'type' => 'nullable|string|max:255',
            'subject' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
            'is_completed' => 'nullable|boolean',
        ]);

        $activity->update($data);
        $activity->load('user');

        return new ActivityResource($activity);
    }

    public function destroy(Activity $activity)
    {
        $activity->delete();
        return response()->noContent();
    }
}
