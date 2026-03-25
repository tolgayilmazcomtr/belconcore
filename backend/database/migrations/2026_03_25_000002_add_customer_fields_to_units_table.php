<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete()->after('list_price');
            $table->string('owner_name')->nullable()->after('customer_id');
            $table->string('owner_phone')->nullable()->after('owner_name');
            $table->text('owner_note')->nullable()->after('owner_phone');
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_id');
            $table->dropColumn(['owner_name', 'owner_phone', 'owner_note']);
        });
    }
};
