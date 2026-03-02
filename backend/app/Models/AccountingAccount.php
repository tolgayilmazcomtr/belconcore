<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingAccount extends Model
{
    protected $table = 'accounting_accounts';

    protected $fillable = [
        'project_id', 'type', 'name', 'tax_number', 'tax_office',
        'phone', 'email', 'address', 'city', 'category', 'group',
        'balance', 'status', 'is_default', 'notes',
    ];

    protected $casts = [
        'balance'    => 'float',
        'is_default' => 'boolean',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'account_id');
    }

    public function payments()
    {
        return $this->hasMany(AccountingPayment::class, 'account_id');
    }

    /** Recompute balance from invoices and payments */
    public function recalculateBalance(): void
    {
        $totalInvoiced = $this->invoices()->where('type', 'sales')->sum('total')
                       - $this->invoices()->where('type', 'purchase')->sum('total');
        $totalPaid     = $this->payments()->sum('amount');
        $this->update(['balance' => $totalInvoiced - $totalPaid]);
    }
}
