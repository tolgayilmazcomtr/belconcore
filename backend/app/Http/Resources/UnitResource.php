<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'block_id' => $this->block_id,
            'unit_no' => $this->unit_no,
            'floor_no' => $this->floor_no,
            'unit_type' => $this->unit_type,
            'gross_area' => $this->gross_area,
            'net_area' => $this->net_area,
            'status' => $this->status,
            'list_price' => $this->list_price,
            
            'block' => new BlockResource($this->whenLoaded('block')),
        ];
    }
}
