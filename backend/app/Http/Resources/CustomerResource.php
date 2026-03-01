<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'type' => $this->type,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'company_name' => $this->company_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'tax_office' => $this->tax_office,
            'tax_number' => $this->tax_number,
            'address' => $this->address,
            'city' => $this->city,
            'district' => $this->district,
            'country' => $this->country,
            'leads_count' => $this->whenCounted('leads'),
            'offers_count' => $this->whenCounted('offers'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
