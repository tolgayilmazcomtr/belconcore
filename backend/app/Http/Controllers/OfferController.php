<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Models\OfferItem;
use App\Http\Resources\OfferResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class OfferController extends Controller
{
    // Bu yüzdenin ÜZERİNDEKİ indirimler yönetici onayına düşer
    private const DISCOUNT_APPROVAL_THRESHOLD = 5.0;

    private function requiresApproval(float $base, float $discount): bool
    {
        if ($base <= 0 || $discount <= 0) {
            return false;
        }
        return ($discount / $base) * 100 > self::DISCOUNT_APPROVAL_THRESHOLD;
    }

    private function managerOnly(Request $request): void
    {
        $user = $request->user();
        if (!$user || (!$user->hasRole('Admin') && !$user->hasRole('Project Manager'))) {
            abort(403, 'İndirim onayı için yönetici yetkisi gereklidir.');
        }
    }

    public function index(Request $request)
    {
        $query = Offer::with(['customer', 'lead', 'unit.block', 'items.unit.block', 'creator', 'approver']);

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
            'lead_id'      => 'nullable|exists:leads,id',
            'customer_id'  => 'required|exists:customers,id',
            'unit_id'      => 'nullable|exists:units,id',
            'valid_until'  => 'nullable|date',
            'status'       => 'nullable|string|in:draft,sent,accepted,rejected',
            'base_price'   => 'required|numeric',
            'discount_amount' => 'nullable|numeric',
            'final_price'  => 'required|numeric',
            'payment_plan' => 'nullable|string',
            'notes'        => 'nullable|string',
            'offer_items'  => 'nullable|array',
            'offer_items.*.unit_id'         => 'nullable|exists:units,id',
            'offer_items.*.unit_label'       => 'required|string|max:255',
            'offer_items.*.list_price'       => 'required|numeric',
            'offer_items.*.discount_amount'  => 'nullable|numeric',
            'offer_items.*.final_price'      => 'required|numeric',
            'offer_items.*.sort_order'       => 'nullable|integer',
        ]);

        $projectId = $request->active_project_id;
        $data['project_id'] = $projectId;
        $data['created_by'] = $request->user()->id;
        $data['offer_no']   = 'OFR-' . date('Y') . '-' . strtoupper(Str::random(6));

        // %5 üzeri indirim sunucu tarafında yönetici onayına düşer
        $data['approval_status'] = $this->requiresApproval(
            (float) ($data['base_price'] ?? 0),
            (float) ($data['discount_amount'] ?? 0)
        ) ? 'pending' : 'none';

        // İlk birimi unit_id olarak tut (geriye dönük uyumluluk)
        $offerItems = $request->offer_items ?? [];
        if (!empty($offerItems)) {
            $data['unit_id'] = $offerItems[0]['unit_id'] ?? null;
        }

        unset($data['offer_items']);
        $offer = Offer::create($data);

        // Offer items kaydet
        foreach ($offerItems as $i => $item) {
            OfferItem::create([
                'offer_id'        => $offer->id,
                'project_id'      => $projectId,
                'unit_id'         => $item['unit_id'] ?? null,
                'unit_label'      => $item['unit_label'],
                'list_price'      => $item['list_price'],
                'discount_amount' => $item['discount_amount'] ?? 0,
                'final_price'     => $item['final_price'],
                'sort_order'      => $item['sort_order'] ?? $i,
            ]);
        }

        $offer->load(['customer', 'lead', 'unit.block', 'items.unit.block', 'creator']);

        return new OfferResource($offer);
    }

    public function show(Offer $offer)
    {
        $offer->load(['customer', 'lead', 'unit.block', 'items.unit.block', 'creator']);
        return new OfferResource($offer);
    }

    public function update(Request $request, Offer $offer)
    {
        $data = $request->validate([
            'valid_until'     => 'nullable|date',
            'status'          => 'nullable|string|in:draft,sent,accepted,rejected',
            'base_price'      => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric',
            'final_price'     => 'nullable|numeric',
            'payment_plan'    => 'nullable|string',
            'notes'           => 'nullable|string',
            'offer_items'     => 'nullable|array',
            'offer_items.*.unit_id'         => 'nullable|exists:units,id',
            'offer_items.*.unit_label'       => 'required|string|max:255',
            'offer_items.*.list_price'       => 'required|numeric',
            'offer_items.*.discount_amount'  => 'nullable|numeric',
            'offer_items.*.final_price'      => 'required|numeric',
            'offer_items.*.sort_order'       => 'nullable|integer',
        ]);

        $offerItems = $request->offer_items ?? null;

        if ($offerItems !== null) {
            // Eski kalemleri sil, yenilerini ekle
            $offer->items()->delete();
            foreach ($offerItems as $i => $item) {
                OfferItem::create([
                    'offer_id'        => $offer->id,
                    'project_id'      => $offer->project_id,
                    'unit_id'         => $item['unit_id'] ?? null,
                    'unit_label'      => $item['unit_label'],
                    'list_price'      => $item['list_price'],
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'final_price'     => $item['final_price'],
                    'sort_order'      => $item['sort_order'] ?? $i,
                ]);
            }
            $data['unit_id'] = $offerItems[0]['unit_id'] ?? null;
        }

        unset($data['offer_items']);

        // Fiyat/indirim değiştiyse onay durumunu yeniden hesapla
        $newBase = array_key_exists('base_price', $data) ? (float) $data['base_price'] : (float) $offer->base_price;
        $newDisc = array_key_exists('discount_amount', $data) ? (float) ($data['discount_amount'] ?? 0) : (float) $offer->discount_amount;
        $priceChanged = $newBase !== (float) $offer->base_price || $newDisc !== (float) $offer->discount_amount;
        if ($priceChanged) {
            $data['approval_status'] = $this->requiresApproval($newBase, $newDisc) ? 'pending' : 'none';
            $data['approved_by'] = null;
            $data['approved_at'] = null;
        }

        $offer->update($data);
        $offer->load(['customer', 'lead', 'unit.block', 'items.unit.block', 'creator', 'approver']);

        return new OfferResource($offer);
    }

    public function approve(Request $request, Offer $offer)
    {
        $this->managerOnly($request);

        if ($offer->approval_status !== 'pending') {
            return response()->json(['message' => 'Bu teklif onay beklemiyor.'], 422);
        }

        $offer->update([
            'approval_status' => 'approved',
            'approved_by'     => $request->user()->id,
            'approved_at'     => now(),
        ]);

        $offer->load(['customer', 'lead', 'unit.block', 'items.unit.block', 'creator', 'approver']);
        return new OfferResource($offer);
    }

    public function reject(Request $request, Offer $offer)
    {
        $this->managerOnly($request);

        if ($offer->approval_status !== 'pending') {
            return response()->json(['message' => 'Bu teklif onay beklemiyor.'], 422);
        }

        $offer->update([
            'approval_status' => 'rejected',
            'approved_by'     => $request->user()->id,
            'approved_at'     => now(),
        ]);

        $offer->load(['customer', 'lead', 'unit.block', 'items.unit.block', 'creator', 'approver']);
        return new OfferResource($offer);
    }

    public function generatePdf(Request $request, int $offer)
    {
        $offerModel = Offer::withoutGlobalScopes()
            ->with(['customer', 'lead', 'unit.block', 'items.unit.block', 'creator', 'project'])
            ->findOrFail($offer);

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->projects()->where('project_id', $offerModel->project_id)->exists()) {
            abort(403, 'Bu teklife erişim yetkiniz bulunmuyor.');
        }

        // Onay bekleyen/reddedilen indirimli teklifin PDF'i alınamaz
        if ($offerModel->approval_status === 'pending') {
            abort(403, 'Bu teklifteki indirim yönetici onayı bekliyor. Onaylanmadan PDF alınamaz.');
        }
        if ($offerModel->approval_status === 'rejected') {
            abort(403, 'Bu teklifteki indirim yönetici tarafından reddedildi. Lütfen indirimi güncelleyin.');
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
