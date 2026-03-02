<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('status');
            $table->string('company_name')->nullable()->after('logo_path');
            $table->string('company_phone')->nullable()->after('company_name');
            $table->string('company_email')->nullable()->after('company_phone');
            $table->string('company_address')->nullable()->after('company_email');
            $table->string('company_website')->nullable()->after('company_address');
            $table->string('tax_office')->nullable()->after('company_website');
            $table->string('tax_number')->nullable()->after('tax_office');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['logo_path','company_name','company_phone','company_email','company_address','company_website','tax_office','tax_number']);
        });
    }
};
