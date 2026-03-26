<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class StockItem extends Model
{
    protected $fillable = ['project_id', 'name', 'code', 'category', 'unit', 'min_quantity', 'unit_price', 'description', 'created_by'];
    protected $casts = [
        'min_quantity' => 'float',
        'unit_price'   => 'float',
    ];

    public function project()   { return $this->belongsTo(Project::class); }
    public function creator()   { return $this->belongsTo(User::class, 'created_by'); }
    public function movements() { return $this->hasMany(StockMovement::class); }
}
