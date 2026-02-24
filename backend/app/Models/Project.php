<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'start_date',
        'end_date',
        'planned_budget',
        'status',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    public function blocks()
    {
        return $this->hasMany(Block::class);
    }

    public function units()
    {
        return $this->hasMany(Unit::class);
    }
}
