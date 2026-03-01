<?php

namespace App\Models;

use App\Models\Scopes\ProjectScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected static function booted()
    {
        static::addGlobalScope(new ProjectScope);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }
}
