<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blocks', function (Blueprint $table) {
            // Her kattaki kaç daire X ekseninde (sütun) dizileceği
            // Kalan daireler Z ekseninde (sıra) oluşturulur
            $table->unsignedTinyInteger('faces_per_row')->default(4)->after('scene_angle');
        });
    }

    public function down(): void
    {
        Schema::table('blocks', function (Blueprint $table) {
            $table->dropColumn('faces_per_row');
        });
    }
};
