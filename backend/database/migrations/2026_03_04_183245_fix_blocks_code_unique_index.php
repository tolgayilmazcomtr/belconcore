<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Eski unique index'i kaldır (NULL değerler çakışmasın diye)
        Schema::table('blocks', function (Blueprint $table) {
            $table->dropUnique(['project_id', 'code']);
        });

        // Sadece code NULL olmadığında unique olsun mantığı için
        // PHP uygulaması tarafında kontrol edilecek (BlockController'da zaten var)
        // İsteğe bağlı: code dolu olanlar için partial unique index (MySQL 8+)
        // Burada basit çözüm: code dolu ise uygulama katmanında benzersizlik kontrolü yapılıyor
    }

    public function down(): void
    {
        Schema::table('blocks', function (Blueprint $table) {
            $table->unique(['project_id', 'code']);
        });
    }
};
