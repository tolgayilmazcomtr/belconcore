<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scene_labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('text', 100);
            $table->float('x')->default(0);
            $table->float('z')->default(0);
            $table->float('rotation')->default(0);  // derece
            $table->string('color', 20)->default('#1A6B9A');
            $table->float('scale')->default(1.0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scene_labels');
    }
};
