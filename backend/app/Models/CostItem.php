<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CostItem extends Model
{
    protected $fillable = [
        'project_id', 'name', 'category', 'quantity', 'unit',
        'planned_unit_price', 'planned_total',
        'actual_unit_price', 'actual_total',
        'contractor', 'contract_date', 'status', 'notes', 'sort_order', 'created_by',
    ];

    protected $casts = [
        'quantity'           => 'float',
        'planned_unit_price' => 'float',
        'planned_total'      => 'float',
        'actual_unit_price'  => 'float',
        'actual_total'       => 'float',
        'contract_date'      => 'date',
    ];

    public function project() { return $this->belongsTo(Project::class); }
}
