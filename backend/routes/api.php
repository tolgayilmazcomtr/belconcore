<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\BlockController;
use App\Http\Controllers\UnitController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Proje Yönetimi
    Route::apiResource('projects', ProjectController::class);

    // Seçili Proje İçi Modüller (Blok ve Bağımsız Bölüm)
    Route::middleware('project.access')->group(function () {
        Route::apiResource('blocks', BlockController::class);
        Route::apiResource('units', UnitController::class);
    });
});
