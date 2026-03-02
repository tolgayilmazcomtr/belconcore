<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id', 'account_id', 'type', 'invoice_no', 'date', 'due_date',
        'description', 'category', 'currency', 'document_type',
        'subtotal', 'tax_total', 'total', 'paid_amount', 'remaining',
        'status', 'notes',
    ];

    protected $casts = [
        'date'        => 'date',
        'due_date'    => 'date',
        'subtotal'    => 'float',
        'tax_total'   => 'float',
        'total'       => 'float',
        'paid_amount' => 'float',
        'remaining'   => 'float',
    ];

    public function project()    { return $this->belongsTo(Project::class); }
    public function account()    { return $this->belongsTo(AccountingAccount::class, 'account_id'); }
    public function items()      { return $this->hasMany(InvoiceItem::class)->orderBy('sort_order'); }
    public function payments()   { return $this->hasMany(AccountingPayment::class); }
    public function creator()    { return $this->belongsTo(User::class, 'created_by'); }

    /** Recalculate totals from items, update paid/remaining */
    public function recalculate(): void
    {
        $subtotal  = $this->items()->sum(\DB::raw('quantity * unit_price'));
        $taxTotal  = $this->items()->sum('tax_amount');
        $total     = $subtotal + $taxTotal;
        $paid      = $this->payments()->sum('amount');
        $remaining = max(0, $total - $paid);
        $status    = match (true) {
            $remaining <= 0   => 'paid',
            $paid > 0         => 'partial',
            $this->status === 'cancelled' => 'cancelled',
            default           => $this->status,
        };
        $this->update(compact('subtotal', 'taxTotal', 'total', 'paid', 'remaining', 'status'));
    }
}
