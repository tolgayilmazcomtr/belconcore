<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SceneLabel extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'text', 'x', 'z', 'rotation', 'color', 'scale',
    ];

    protected $casts = [
        'x' => 'float',
        'z' => 'float',
        'rotation' => 'float',
        'scale' => 'float',
    ];
}
