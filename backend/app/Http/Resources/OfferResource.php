<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'lead_id' => $this->lead_id,
            'customer_id' => $this->customer_id,
            'unit_id' => $this->unit_id,
            'offer_no' => $this->offer_no,
            'valid_until' => $this->valid_until ? $this->valid_until->format('Y-m-d') : null,
            'status' => $this->status,
            'base_price' => $this->base_price,
            'discount_amount' => $this->discount_amount,
            'final_price' => $this->final_price,
            'payment_plan' => $this->payment_plan,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'lead' => new LeadResource($this->whenLoaded('lead')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'items' => $this->whenLoaded('items', fn() => $this->items->map(fn($item) => [
                'id'              => $item->id,
                'unit_id'         => $item->unit_id,
                'unit_label'      => $item->unit_label,
                'list_price'      => $item->list_price,
                'discount_amount' => $item->discount_amount,
                'final_price'     => $item->final_price,
                'sort_order'      => $item->sort_order,
                'unit'            => $item->relationLoaded('unit') ? new UnitResource($item->unit) : null,
            ])),
            
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
