<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['cash', 'bank'])->default('cash');
            $table->string('name');
            $table->string('bank_name')->nullable();
            $table->string('branch')->nullable();
            $table->string('account_no')->nullable();
            $table->string('iban', 34)->nullable();
            $table->string('currency', 10)->default('TRY');
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->boolean('is_default')->default(false);
            $table->enum('status', ['active', 'passive'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['project_id', 'type']);
        });

        Schema::create('finance_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('finance_accounts')->cascadeOnDelete();
            $table->foreignId('transfer_to_account_id')->nullable()->constrained('finance_accounts')->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['income', 'expense', 'transfer'])->default('income');
            $table->decimal('amount', 15, 2);
            $table->date('date');
            $table->string('description')->nullable();
            $table->string('category')->nullable();
            $table->string('reference')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['project_id', 'date']);
            $table->index('account_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_transactions');
        Schema::dropIfExists('finance_accounts');
    }
};
