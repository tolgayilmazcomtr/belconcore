<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained('accounting_accounts')->nullOnDelete();
            $table->enum('type', ['sales', 'purchase'])->default('sales');
            $table->string('invoice_no')->nullable();
            $table->date('date');
            $table->date('due_date')->nullable();
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('currency', 10)->default('TRY');
            $table->enum('document_type', ['paper', 'e-invoice', 'e-archive'])->default('paper');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('remaining', 15, 2)->default(0);
            $table->enum('status', ['draft', 'sent', 'paid', 'partial', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['project_id', 'type', 'status']);
            $table->index(['project_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
