<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['customer', 'supplier', 'both'])->default('customer');
            $table->string('name');
            $table->string('tax_number', 50)->nullable();
            $table->string('tax_office')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('category')->nullable();
            $table->string('group')->nullable();
            $table->decimal('balance', 15, 2)->default(0);
            $table->enum('status', ['active', 'passive'])->default('active');
            $table->boolean('is_default')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['project_id', 'status']);
            $table->index(['project_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_accounts');
    }
};
