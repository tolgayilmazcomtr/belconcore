<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'customer_id' => $this->customer_id,
            'unit_id' => $this->unit_id,
            'title' => $this->title,
            'description' => $this->description,
            'source' => $this->source,
            'status' => $this->status,
            'expected_value' => $this->expected_value,
            'assigned_to' => $this->assigned_to,
            
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
