<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteProgressItem extends Model
{
    protected $fillable = [
        'project_id',
        'block_id',
        'name',
        'category',
        'progress',
        'note',
    ];

    protected $casts = [
        'progress' => 'integer',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function block()
    {
        return $this->belongsTo(Block::class);
    }
}
