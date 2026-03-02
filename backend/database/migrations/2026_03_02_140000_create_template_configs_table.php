<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type')->default('offer'); // offer, invoice, ...
            $table->string('name')->default('Varsayılan Şablon');
            $table->json('blocks'); // ordered array of block configs
            $table->json('page_settings')->nullable(); // margins, font-size, etc.
            $table->boolean('is_default')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_configs');
    }
};
