<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id', 'description', 'quantity', 'unit',
        'unit_price', 'tax_rate', 'tax_amount', 'total', 'sort_order',
    ];

    protected $casts = [
        'quantity'   => 'float',
        'unit_price' => 'float',
        'tax_rate'   => 'float',
        'tax_amount' => 'float',
        'total'      => 'float',
    ];

    public function invoice() { return $this->belongsTo(Invoice::class); }
}
