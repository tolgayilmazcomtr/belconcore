<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'lead_id' => $this->lead_id,
            'type' => $this->type,
            'subject' => $this->subject,
            'notes' => $this->notes,
            'due_date' => $this->due_date,
            'is_completed' => (bool) $this->is_completed,
            'user_id' => $this->user_id,
            
            'user' => new UserResource($this->whenLoaded('user')),
            
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
