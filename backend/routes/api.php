<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\BlockController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\SceneLabelController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\TemplateConfigController;
use App\Http\Controllers\AccountingAccountController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\AccountingPaymentController;
use App\Http\Controllers\FinanceAccountController;
use App\Http\Controllers\CostItemController;
use App\Http\Controllers\CheckController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\UserController;

// Public Auth Routes
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Kullanıcı & Rol Yönetimi (Admin only - controller içinde kontrol edilir)
    Route::get('users', [UserController::class, 'index']);
    Route::post('users', [UserController::class, 'store']);
    Route::put('users/{id}', [UserController::class, 'update']);
    Route::delete('users/{id}', [UserController::class, 'destroy']);
    Route::get('roles', [UserController::class, 'roles']);
    Route::put('roles/{id}/permissions', [UserController::class, 'updateRolePermissions']);
    Route::post('roles/init-defaults', [UserController::class, 'initRoleDefaults']);

    // Proje Yönetimi
    Route::post('projects/{id}/logo', [ProjectController::class, 'uploadLogo']);
    Route::apiResource('projects', ProjectController::class);

    // Seçili Proje İçi Modüller (Blok ve Bağımsız Bölüm)
    // PDF endpoints - project.access dışında, doğrudan auth ile erişilir
        Route::get('offers/{offer}/pdf', [OfferController::class, 'generatePdf']);
        Route::get('accounting/invoices/{id}/pdf', [InvoiceController::class, 'generatePdf']);

        Route::middleware('project.access')->group(function () {
        Route::apiResource('blocks', BlockController::class);
        Route::apiResource('scene-labels', SceneLabelController::class)->only(['index', 'store', 'update', 'destroy']);
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

        // Maliyet Takip
        Route::get('costs/summary',  [CostItemController::class, 'summary']);
        Route::get('costs/settings', [CostItemController::class, 'getSettings']);
        Route::put('costs/settings', [CostItemController::class, 'updateSettings']);
        Route::post('costs/reorder', [CostItemController::class, 'reorder']);
        Route::get('costs',          [CostItemController::class, 'index']);
        Route::post('costs',         [CostItemController::class, 'store']);
        Route::put('costs/{id}',     [CostItemController::class, 'update']);
        Route::delete('costs/{id}',  [CostItemController::class, 'destroy']);

        // Sözleşme & Ödeme Planı
        Route::get('contracts/summary', [ContractController::class, 'summary']);
        Route::apiResource('contracts', ContractController::class);
        Route::get('contracts/{contract}/installments', [ContractController::class, 'installments']);
        Route::post('contracts/{contract}/installments', [ContractController::class, 'storeInstallment']);
        Route::put('contracts/{contract}/installments/{installment}', [ContractController::class, 'updateInstallment']);
        Route::delete('contracts/{contract}/installments/{installment}', [ContractController::class, 'destroyInstallment']);
        Route::post('contracts/{contract}/installments/{installment}/invoice', [ContractController::class, 'invoiceInstallment']);
        Route::post('contracts/{contract}/document', [ContractController::class, 'uploadDocument']);
        Route::delete('contracts/{contract}/document', [ContractController::class, 'deleteDocument']);

        // Çek & Senet Yönetimi
        Route::get('checks/summary',  [CheckController::class, 'summary']);
        Route::post('checks/{id}/copy', [CheckController::class, 'copy']);
        Route::apiResource('checks', CheckController::class);

        // Stok & Depo Yönetimi
        Route::get('stock/summary',                         [StockController::class, 'summary']);
        Route::get('stock/categories',                      [StockController::class, 'categories']);
        Route::get('stock/warehouses',                      [StockController::class, 'warehouses']);
        Route::post('stock/warehouses',                     [StockController::class, 'storeWarehouse']);
        Route::put('stock/warehouses/{id}',                 [StockController::class, 'updateWarehouse']);
        Route::delete('stock/warehouses/{id}',              [StockController::class, 'destroyWarehouse']);
        Route::get('stock/items',                           [StockController::class, 'items']);
        Route::post('stock/items',                          [StockController::class, 'storeItem']);
        Route::put('stock/items/{id}',                      [StockController::class, 'updateItem']);
        Route::delete('stock/items/{id}',                   [StockController::class, 'destroyItem']);
        Route::get('stock/movements',                       [StockController::class, 'movements']);
        Route::post('stock/movements',                      [StockController::class, 'storeMovement']);
        Route::put('stock/movements/{id}',                  [StockController::class, 'updateMovement']);
        Route::delete('stock/movements/{id}',               [StockController::class, 'destroyMovement']);

        // Finans – Kasa & Bankalar
        Route::get('finance/accounts',                        [FinanceAccountController::class, 'indexAccounts']);
        Route::post('finance/accounts',                       [FinanceAccountController::class, 'storeAccount']);
        Route::put('finance/accounts/{account}',              [FinanceAccountController::class, 'updateAccount']);
        Route::delete('finance/accounts/{account}',           [FinanceAccountController::class, 'destroyAccount']);
        Route::get('finance/summary',                         [FinanceAccountController::class, 'summary']);
        Route::get('finance/transactions',                    [FinanceAccountController::class, 'indexTransactions']);
        Route::post('finance/transactions',                   [FinanceAccountController::class, 'storeTransaction']);
        Route::delete('finance/transactions/{transaction}',   [FinanceAccountController::class, 'destroyTransaction']);
        });

    // Şablon Editörü
    Route::get('template-configs/{type}', [TemplateConfigController::class, 'show']);
    Route::post('template-configs', [TemplateConfigController::class, 'store']);

});
