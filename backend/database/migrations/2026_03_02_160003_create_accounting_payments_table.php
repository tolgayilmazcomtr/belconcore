<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained('accounting_accounts')->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->date('date');
            $table->enum('method', ['cash', 'bank', 'check', 'credit_card', 'other'])->default('cash');
            $table->string('bank_name')->nullable();
            $table->string('reference_no')->nullable();
            $table->string('receipt_no')->nullable();
            $table->date('check_due_date')->nullable(); // Çek vade tarihi
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['project_id', 'date']);
            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_payments');
    }
};
