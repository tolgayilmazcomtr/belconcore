<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Http\Resources\LeadResource;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $query = Lead::with(['customer', 'assignee', 'unit']);

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }
        
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->query('customer_id'));
        }

        return LeadResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'unit_id' => 'nullable|exists:units,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'source' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:new,contacted,qualified,proposal,won,lost',
            'expected_value' => 'nullable|numeric',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $data['project_id'] = $request->active_project_id;

        $lead = Lead::create($data);
        $lead->load(['customer', 'assignee', 'unit']);

        return new LeadResource($lead);
    }

    public function show(Lead $lead)
    {
        $lead->load(['customer', 'assignee', 'unit', 'activities.user', 'offers']);
        return new LeadResource($lead);
    }

    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'unit_id' => 'nullable|exists:units,id',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'source' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:new,contacted,qualified,proposal,won,lost',
            'expected_value' => 'nullable|numeric',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $lead->update($data);
        $lead->load(['customer', 'assignee', 'unit']);

        return new LeadResource($lead);
    }

    public function updateStatus(Request $request, Lead $lead)
    {
        $request->validate(['status' => 'required|string|in:new,contacted,qualified,proposal,won,lost']);
        $lead->update(['status' => $request->status]);
        
        return response()->json(['message' => 'Status updated successfully.']);
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();
        return response()->noContent();
    }
}
