<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('block_id')->nullable()->constrained()->nullOnDelete();
            $table->string('unit_no'); // Daire No: 1, 2, 3..
            $table->string('floor_no')->nullable(); // Kat No
            $table->string('unit_type'); // 1+1, 2+1, Dükkan
            $table->decimal('gross_area', 8, 2)->nullable(); // Brüt M2
            $table->decimal('net_area', 8, 2)->nullable(); // Net M2
            $table->enum('status', ['available', 'reserved', 'sold', 'not_for_sale'])->default('available');
            $table->decimal('list_price', 15, 2)->nullable();
            
            $table->unique(['project_id', 'block_id', 'unit_no']);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
