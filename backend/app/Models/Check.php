<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Check extends Model
{
    protected $table = 'checks';

    protected $fillable = [
        'project_id', 'type', 'document_type', 'check_no', 'amount', 'issue_date', 'due_date',
        'bank_name', 'branch', 'counterparty', 'description', 'attachment_path', 'status',
        'accounting_account_id', 'invoice_id', 'created_by',
    ];

    protected $casts = [
        'amount'     => 'float',
        'issue_date' => 'date',
        'due_date'   => 'date',
    ];

    public function project()          { return $this->belongsTo(Project::class); }
    public function accountingAccount(){ return $this->belongsTo(AccountingAccount::class, 'accounting_account_id'); }
    public function invoice()          { return $this->belongsTo(Invoice::class); }
    public function creator()          { return $this->belongsTo(User::class, 'created_by'); }
}
