<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    protected $fillable = [
        'project_id', 'type', 'title', 'counterparty', 'accounting_account_id',
        'unit_id', 'total_value', 'start_date', 'end_date', 'status',
        'description', 'created_by',
    ];

    protected $casts = [
        'total_value' => 'float',
        'start_date'  => 'date',
        'end_date'    => 'date',
    ];

    public function project()          { return $this->belongsTo(Project::class); }
    public function accountingAccount(){ return $this->belongsTo(AccountingAccount::class, 'accounting_account_id'); }
    public function creator()          { return $this->belongsTo(User::class, 'created_by'); }
    public function installments()     { return $this->hasMany(ContractInstallment::class)->orderBy('due_date'); }
}
