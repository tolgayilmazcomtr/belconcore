<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'project_id', 'stock_item_id', 'warehouse_id', 'type',
        'quantity', 'unit_price', 'total_price', 'date',
        'reference_no', 'supplier', 'description', 'created_by',
    ];
    protected $casts = [
        'quantity'    => 'float',
        'unit_price'  => 'float',
        'total_price' => 'float',
        'date'        => 'date',
    ];

    public function project()   { return $this->belongsTo(Project::class); }
    public function stockItem() { return $this->belongsTo(StockItem::class); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function creator()   { return $this->belongsTo(User::class, 'created_by'); }
}
