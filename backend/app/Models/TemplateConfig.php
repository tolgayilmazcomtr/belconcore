<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateConfig extends Model
{
    protected $fillable = [
        'project_id',
        'type',
        'name',
        'blocks',
        'page_settings',
        'is_default',
    ];

    protected $casts = [
        'blocks' => 'array',
        'page_settings' => 'array',
        'is_default' => 'boolean',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
