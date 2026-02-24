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
}
