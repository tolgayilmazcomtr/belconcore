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
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->enum('type', ['customer_sale', 'contractor', 'supplier', 'other'])->default('other');
            $table->string('title', 255);
            $table->string('counterparty', 255)->nullable(); // müşteri / taşeron adı
            $table->unsignedBigInteger('accounting_account_id')->nullable();
            $table->unsignedBigInteger('unit_id')->nullable(); // ilgili daire (müşteri satışında)
            $table->decimal('total_value', 15, 2)->default(0); // toplam sözleşme bedeli (TL)
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable(); // tahmini iş bitiş tarihi
            $table->enum('status', ['draft', 'active', 'completed', 'cancelled'])->default('active');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('accounting_account_id')->references('id')->on('accounting_accounts')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
