<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = ['project_id', 'name', 'location', 'description', 'is_active', 'created_by'];
    protected $casts = ['is_active' => 'boolean'];

    public function project()    { return $this->belongsTo(Project::class); }
    public function creator()    { return $this->belongsTo(User::class, 'created_by'); }
    public function movements()  { return $this->hasMany(StockMovement::class); }
}
