<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\BlockController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\TemplateConfigController;
use App\Http\Controllers\AccountingAccountController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\AccountingPaymentController;

// Public Auth Routes
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Proje Yönetimi
    Route::post('projects/{id}/logo', [ProjectController::class, 'uploadLogo']);
    Route::apiResource('projects', ProjectController::class);

    // Seçili Proje İçi Modüller (Blok ve Bağımsız Bölüm)
    // Offer PDF - project.access dışında, doğrudan auth ile erişilir
        Route::get('offers/{offer}/pdf', [OfferController::class, 'generatePdf']);

        Route::middleware('project.access')->group(function () {
        Route::apiResource('blocks', BlockController::class);
        Route::post('units/bulk', [UnitController::class, 'storeBulk']);
        Route::apiResource('units', UnitController::class);
        
        // CRM & Sales
        Route::apiResource('customers', CustomerController::class);
        Route::put('leads/{lead}/status', [LeadController::class, 'updateStatus']);
        Route::apiResource('leads', LeadController::class);
        Route::apiResource('activities', ActivityController::class);
        
        Route::apiResource('offers', OfferController::class);

        // Muhasebe (Accounting)
        Route::apiResource('accounting/accounts', AccountingAccountController::class);
        Route::apiResource('accounting/invoices', InvoiceController::class);
        Route::get('accounting/payments', [AccountingPaymentController::class, 'index']);
        Route::post('accounting/payments', [AccountingPaymentController::class, 'store']);
        Route::delete('accounting/payments/{id}', [AccountingPaymentController::class, 'destroy']);
        });

    // Şablon Editörü
    Route::get('template-configs/{type}', [TemplateConfigController::class, 'show']);
    Route::post('template-configs', [TemplateConfigController::class, 'store']);

});
