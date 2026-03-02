<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingPayment extends Model
{
    protected $fillable = [
        'project_id', 'invoice_id', 'account_id', 'amount', 'date',
        'method', 'bank_name', 'reference_no', 'receipt_no',
        'check_due_date', 'notes', 'created_by',
    ];

    protected $casts = [
        'amount'         => 'float',
        'date'           => 'date',
        'check_due_date' => 'date',
    ];

    public function invoice() { return $this->belongsTo(Invoice::class); }
    public function account() { return $this->belongsTo(AccountingAccount::class, 'account_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
