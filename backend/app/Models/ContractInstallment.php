<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractInstallment extends Model
{
    protected $fillable = [
        'contract_id', 'project_id', 'installment_no', 'description', 'amount',
        'due_date', 'payment_type', 'unit_id', 'status', 'paid_amount',
        'paid_date', 'notes', 'created_by',
    ];

    protected $casts = [
        'amount'      => 'float',
        'paid_amount' => 'float',
        'due_date'    => 'date',
        'paid_date'   => 'date',
    ];

    public function contract() { return $this->belongsTo(Contract::class); }
    public function creator()  { return $this->belongsTo(User::class, 'created_by'); }
}
