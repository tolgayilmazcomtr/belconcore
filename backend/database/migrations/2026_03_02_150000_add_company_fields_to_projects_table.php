<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Logo & company info columns (added to model but not yet migrated)
            if (!Schema::hasColumn('projects', 'logo_path')) {
                $table->string('logo_path')->nullable()->after('status');
            }
            if (!Schema::hasColumn('projects', 'company_name')) {
                $table->string('company_name')->nullable()->after('logo_path');
            }
            if (!Schema::hasColumn('projects', 'company_phone')) {
                $table->string('company_phone', 50)->nullable()->after('company_name');
            }
            if (!Schema::hasColumn('projects', 'company_email')) {
                $table->string('company_email')->nullable()->after('company_phone');
            }
            if (!Schema::hasColumn('projects', 'company_address')) {
                $table->text('company_address')->nullable()->after('company_email');
            }
            if (!Schema::hasColumn('projects', 'company_website')) {
                $table->string('company_website')->nullable()->after('company_address');
            }
            if (!Schema::hasColumn('projects', 'tax_office')) {
                $table->string('tax_office')->nullable()->after('company_website');
            }
            if (!Schema::hasColumn('projects', 'tax_number')) {
                $table->string('tax_number', 50)->nullable()->after('tax_office');
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'logo_path', 'company_name', 'company_phone', 'company_email',
                'company_address', 'company_website', 'tax_office', 'tax_number',
            ]);
        });
    }
};
