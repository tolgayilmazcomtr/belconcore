<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Http\Resources\OfferResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class OfferController extends Controller
{
    public function index(Request $request)
    {
        $query = Offer::with(['customer', 'lead', 'unit.block', 'creator']);

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
            'lead_id' => 'nullable|exists:leads,id',
            'customer_id' => 'required|exists:customers,id',
            'unit_id' => 'nullable|exists:units,id',
            'valid_until' => 'nullable|date',
            'status' => 'nullable|string|in:draft,sent,accepted,rejected',
            'base_price' => 'required|numeric',
            'discount_amount' => 'nullable|numeric',
            'final_price' => 'required|numeric',
            'payment_plan' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $data['project_id'] = $request->active_project_id;
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
            'payment_plan' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $offer->update($data);
        $offer->load(['customer', 'lead', 'unit', 'creator']);

        return new OfferResource($offer);
    }

    public function generatePdf(Request $request, int $offer)
    {
        // Bypass ProjectScope since this route is accessed directly via browser (no active_project_id header)
        $offerModel = Offer::withoutGlobalScopes()->with(['customer', 'lead', 'unit.block', 'creator', 'project'])->findOrFail($offer);

        // Security: make sure the authenticated user can access this project
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->projects()->where('project_id', $offerModel->project_id)->exists()) {
            abort(403, 'Bu teklife erişim yetkiniz bulunmuyor.');
        }

        $pdf = Pdf::loadView('pdf.offer_template', ['offer' => $offerModel])
            ->setOptions([
                'defaultFont'          => 'DejaVu Sans',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
            ])
            ->setPaper('A4', 'portrait');

        return $pdf->download("Teklif_{$offerModel->offer_no}.pdf");
    }

    public function destroy(Offer $offer)
    {
        $offer->delete();
        return response()->noContent();
    }
}
