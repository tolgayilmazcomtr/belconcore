<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CostSetting extends Model
{
    protected $fillable = ['project_id', 'unit_count', 'currency', 'notes'];

    protected $casts = ['unit_count' => 'integer'];

    public function project() { return $this->belongsTo(Project::class); }
}
