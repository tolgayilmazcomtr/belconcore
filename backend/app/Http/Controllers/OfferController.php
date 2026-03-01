<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Http\Resources\OfferResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OfferController extends Controller
{
    public function index(Request $request)
    {
        $query = Offer::with(['customer', 'lead', 'unit', 'creator']);

        if ($request->has('lead_id')) {
            $query->where('lead_id', $request->query('lead_id'));
        }
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->query('customer_id'));
        }

        return OfferResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'customer_id' => 'required|exists:customers,id',
            'unit_id' => 'nullable|exists:units,id',
            'valid_until' => 'nullable|date',
            'status' => 'nullable|string|in:draft,sent,accepted,rejected',
            'base_price' => 'required|numeric',
            'discount_amount' => 'nullable|numeric',
            'final_price' => 'required|numeric',
            'payment_plan' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $data['project_id'] = $request->header('X-Project-Id');
        $data['created_by'] = $request->user()->id;
        
        // Generate unique offer number logic: OFR-{YEAR}-{RANDOM}
        $data['offer_no'] = 'OFR-' . date('Y') . '-' . strtoupper(Str::random(6));

        $offer = Offer::create($data);
        $offer->load(['customer', 'lead', 'unit', 'creator']);

        return new OfferResource($offer);
    }

    public function show(Offer $offer)
    {
        $offer->load(['customer', 'lead', 'unit', 'creator']);
        return new OfferResource($offer);
    }

    public function update(Request $request, Offer $offer)
    {
        $data = $request->validate([
            'valid_until' => 'nullable|date',
            'status' => 'nullable|string|in:draft,sent,accepted,rejected',
            'base_price' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric',
            'final_price' => 'nullable|numeric',
            'payment_plan' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $offer->update($data);
        $offer->load(['customer', 'lead', 'unit', 'creator']);

        return new OfferResource($offer);
    }

    public function destroy(Offer $offer)
    {
        $offer->delete();
        return response()->noContent();
    }
}
