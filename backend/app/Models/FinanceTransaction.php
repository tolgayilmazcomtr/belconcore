<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinanceTransaction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id', 'account_id', 'transfer_to_account_id', 'invoice_id',
        'type', 'amount', 'date', 'description', 'category', 'reference', 'created_by',
    ];

    protected $casts = [
        'amount' => 'float',
        'date'   => 'date',
    ];

    public function account()         { return $this->belongsTo(FinanceAccount::class, 'account_id'); }
    public function transferTo()      { return $this->belongsTo(FinanceAccount::class, 'transfer_to_account_id'); }
    public function invoice()         { return $this->belongsTo(Invoice::class); }
    public function creator()         { return $this->belongsTo(User::class, 'created_by'); }
}
