<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('stock_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('name', 150);
            $table->string('code', 50)->nullable();
            $table->string('category', 100)->nullable(); // çimento, demir, boya, vs.
            $table->string('unit', 20)->default('adet'); // adet, kg, ton, m2, m3, lt, m
            $table->decimal('min_quantity', 15, 3)->default(0); // düşük stok uyarı eşiği
            $table->decimal('unit_price', 15, 2)->nullable(); // ortalama/son birim fiyat
            $table->text('description')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }
    public function down(): void { Schema::dropIfExists('stock_items'); }
};
