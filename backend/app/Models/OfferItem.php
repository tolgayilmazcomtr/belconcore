<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfferItem extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'list_price'      => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'final_price'     => 'decimal:2',
    ];

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
