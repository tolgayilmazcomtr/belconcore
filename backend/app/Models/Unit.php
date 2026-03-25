<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id',
        'block_id',
        'unit_no',
        'floor_no',
        'unit_type',
        'gross_area',
        'net_area',
        'status',
        'list_price',
        'customer_id',
        'owner_name',
        'owner_phone',
        'owner_note',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function block()
    {
        return $this->belongsTo(Block::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }
}
