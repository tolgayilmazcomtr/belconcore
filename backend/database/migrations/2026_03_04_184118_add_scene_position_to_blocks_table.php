<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blocks', function (Blueprint $table) {
            $table->float('scene_x')->default(0)->after('parcel_island');     // 3D sahnesindeki X konumu
            $table->float('scene_z')->default(0)->after('scene_x');           // 3D sahnesindeki Z konumu
            $table->float('scene_angle')->default(0)->after('scene_z');       // Derece cinsinden rotasyon (0-360)
        });
    }

    public function down(): void
    {
        Schema::table('blocks', function (Blueprint $table) {
            $table->dropColumn(['scene_x', 'scene_z', 'scene_angle']);
        });
    }
};
