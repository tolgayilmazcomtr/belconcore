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
        'logo_path',
        'company_name',
        'company_phone',
        'company_email',
        'company_address',
        'company_website',
        'tax_office',
        'tax_number',
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

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }
}
