<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ProjectScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $projectId = request()->header('X-Project-Id') 
            ?? request()->input('project_id') 
            ?? request()->input('active_project_id');

        // Fallback for authenticated user's current project ID
        if (!$projectId && auth()->check() && auth()->user()->current_project_id) {
            $projectId = auth()->user()->current_project_id;
        }

        if ($projectId) {
            $builder->where($model->getTable() . '.project_id', $projectId);
        }
    }
}
