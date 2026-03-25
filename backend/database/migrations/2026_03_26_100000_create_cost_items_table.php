<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cost_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category')->nullable();
            $table->decimal('quantity', 15, 3)->nullable();
            $table->string('unit')->nullable();
            $table->decimal('planned_unit_price', 15, 2)->nullable();
            $table->decimal('planned_total', 15, 2)->nullable();
            $table->decimal('actual_unit_price', 15, 2)->nullable();
            $table->decimal('actual_total', 15, 2)->nullable();
            $table->string('contractor')->nullable();
            $table->date('contract_date')->nullable();
            $table->enum('status', ['planned', 'contracted', 'in_progress', 'completed', 'cancelled'])->default('planned');
            $table->text('notes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'category']);
            $table->index(['project_id', 'status']);
        });

        Schema::create('cost_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained()->cascadeOnDelete();
            $table->integer('unit_count')->default(1);
            $table->string('currency')->default('TRY');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cost_settings');
        Schema::dropIfExists('cost_items');
    }
};
