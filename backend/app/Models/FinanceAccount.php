<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinanceAccount extends Model
{
    protected $table = 'finance_accounts';

    protected $fillable = [
        'project_id', 'type', 'name', 'bank_name', 'branch',
        'account_no', 'iban', 'currency', 'balance', 'opening_balance',
        'is_default', 'status', 'notes',
    ];

    protected $casts = [
        'balance'         => 'float',
        'opening_balance' => 'float',
        'is_default'      => 'boolean',
    ];

    public function project()      { return $this->belongsTo(Project::class); }
    public function transactions() { return $this->hasMany(FinanceTransaction::class, 'account_id'); }

    /** Recalculate balance from transactions */
    public function recalculate(): void
    {
        $income   = $this->transactions()->where('type', 'income')->sum('amount');
        $expense  = $this->transactions()->where('type', 'expense')->sum('amount');
        $transferOut = $this->transactions()->where('type', 'transfer')->sum('amount');
        $transferIn  = FinanceTransaction::where('transfer_to_account_id', $this->id)->sum('amount');
        $this->update(['balance' => $this->opening_balance + $income - $expense - $transferOut + $transferIn]);
    }
}
