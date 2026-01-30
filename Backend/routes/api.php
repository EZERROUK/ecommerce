<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| IMPORTS DES CONTROLEURS API PUBLICS
|--------------------------------------------------------------------------
*/

// Catalogue produits
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductSearchController;
use App\Http\Controllers\Api\ProductHighlightController;
use App\Http\Controllers\Api\ProductDocumentController as PublicProductDocumentController;
use App\Http\Controllers\Api\WebOrderController as PublicWebOrderController;
use App\Http\Controllers\Api\ProductReviewController as PublicProductReviewController;
use App\Http\Controllers\Api\BlogPostController as PublicBlogPostController;

// Catégories
use App\Http\Controllers\Api\CategoryController as PublicCategoryController;
use App\Http\Controllers\Api\CategoryProductController;
use App\Http\Controllers\Api\CategoryFilterController;

// Promotions
use App\Http\Controllers\Api\PromotionController;

// Portail Client
use App\Http\Controllers\Api\Client\AuthController;
use App\Http\Controllers\Api\Client\ProfileController;
use App\Http\Controllers\Api\Client\QuoteController;
use App\Http\Controllers\Api\Client\InvoiceController;
use App\Http\Controllers\Api\Client\OrderController;
use App\Http\Controllers\Api\Client\SupportTicketController;
use App\Http\Controllers\Api\Client\ProductDocumentController;
use App\Http\Controllers\Api\Client\ProductConfigController;

// API v1 Back-office
use App\Http\Controllers\Api\V1\ClientController as V1ClientController;
use App\Http\Controllers\Api\V1\ProviderController as V1ProviderController;
use App\Http\Controllers\Api\V1\CategoryController as V1CategoryController;
use App\Http\Controllers\Api\V1\ProductController as V1ProductController;
use App\Http\Controllers\Api\V1\QuoteController as V1QuoteController;
use App\Http\Controllers\Api\V1\InvoiceController as V1InvoiceController;
use App\Http\Controllers\Api\V1\OrderController as V1OrderController;
use App\Http\Controllers\Api\V1\StockMovementController as V1StockMovementController;
use App\Http\Controllers\Api\V1\BrandController as V1BrandController;
use App\Http\Controllers\Api\V1\CurrencyController as V1CurrencyController;
use App\Http\Controllers\Api\V1\TaxRateController as V1TaxRateController;
use App\Http\Controllers\Api\V1\PromotionController as V1PromotionController;
use App\Http\Controllers\Api\V1\PromotionCodeController as V1PromotionCodeController;
use App\Http\Controllers\Api\V1\StockMovementReasonController as V1StockMovementReasonController;
use App\Http\Controllers\Api\V1\ProductVariantController as V1ProductVariantController;
use App\Http\Controllers\Api\V1\ProductImageController as V1ProductImageController;
use App\Http\Controllers\Api\V1\PriceHistoryController as V1PriceHistoryController;
use App\Http\Controllers\Api\V1\StockMovementAttachmentController as V1StockMovementAttachmentController;
use App\Http\Controllers\Api\V1\DepartmentController as V1DepartmentController;
use App\Http\Controllers\Api\V1\EmployeeController as V1EmployeeController;
use App\Http\Controllers\Api\V1\LeaveTypeController as V1LeaveTypeController;
use App\Http\Controllers\Api\V1\LeaveBalanceController as V1LeaveBalanceController;
use App\Http\Controllers\Api\V1\LeaveRequestController as V1LeaveRequestController;
use App\Http\Controllers\Api\V1\HolidayController as V1HolidayController;

// Back-office interne
use App\Http\Controllers\CategoryController;



/*
|--------------------------------------------------------------------------
| API PUBLIC (accessible sans authentification)
|--------------------------------------------------------------------------
*/

/** 🔐 Login portail client */
Route::post('/client/login', [AuthController::class, 'login'])
    ->middleware('throttle:client-login')
    ->name('client.login');



/*
|--------------------------------------------------------------------------
| 📦 CATALOGUE PRODUITS (PUBLIC)
|--------------------------------------------------------------------------
*/

// Listing + page produit
Route::get('/products', [ProductController::class, 'index'])->middleware('throttle:public-api');

// Détail produit via slug (SEO-friendly) (IMPORTANT: doit être avant /products/{id})
Route::get('/products/slug/{slug}', [ProductController::class, 'showBySlug'])->middleware('throttle:public-api');

// Recherche avancée (IMPORTANT: doit être avant /products/{id})
Route::get('/products/search', [ProductSearchController::class, 'search'])->middleware('throttle:public-search');

// Nouveautés / Best sellers (IMPORTANT: doit être avant /products/{id})
Route::get('/products/new', [ProductHighlightController::class, 'newProducts'])->middleware('throttle:public-api');
Route::get('/products/best-sellers', [ProductHighlightController::class, 'bestSellers'])->middleware('throttle:public-api');

// Détail produit (contraint pour éviter les collisions avec les routes statiques)
Route::get('/products/{id}', [ProductController::class, 'show'])->middleware('throttle:public-api')->whereUuid('id');

// Documents liés
Route::get('/products/{id}/documents', [PublicProductDocumentController::class, 'index'])->middleware('throttle:public-api')->whereUuid('id');

// Recommandés
Route::get('/products/{id}/recommended', [ProductHighlightController::class, 'recommended'])->middleware('throttle:public-api')->whereUuid('id');

// Avis produits (public)
Route::get('/products/{id}/reviews', [PublicProductReviewController::class, 'index'])->middleware('throttle:public-api')->whereUuid('id');
Route::post('/products/{id}/reviews', [PublicProductReviewController::class, 'store'])
    ->middleware('throttle:10,1')
    ->whereUuid('id');

// Promotions
Route::get('/promotions', [PromotionController::class, 'index'])->middleware('throttle:public-api');

// Checkout e-commerce (Cash On Delivery)
Route::post('/orders', [PublicWebOrderController::class, 'store'])->middleware('throttle:30,1');

// Suivi commande public (order_number + email)
Route::get('/orders/track', [PublicWebOrderController::class, 'track'])->middleware('throttle:30,1');


/*
|--------------------------------------------------------------------------
| 📰 ACTUALITÉS & BLOG (PUBLIC)
|--------------------------------------------------------------------------
*/

Route::get('/blog-posts', [PublicBlogPostController::class, 'index'])->middleware('throttle:public-api');
Route::get('/blog-posts/{slug}', [PublicBlogPostController::class, 'show'])->middleware('throttle:public-api');


/*
|--------------------------------------------------------------------------
| 📚 CATÉGORIES (PUBLIC)
|--------------------------------------------------------------------------
*/

// Arborescence complète
Route::get('/categories/tree', [PublicCategoryController::class, 'tree'])->middleware('throttle:public-api');

// Catégorie + sous-catégories
Route::get('/categories/{id}/tree', [PublicCategoryController::class, 'show'])->middleware('throttle:public-api');

// Produits d’une catégorie
Route::get('/categories/{id}/products', [CategoryProductController::class, 'index'])->middleware('throttle:public-api');

// Filtres dynamiques
Route::get('/categories/{id}/filters', [CategoryFilterController::class, 'filters'])->middleware('throttle:public-api');



/*
|--------------------------------------------------------------------------
| API PORTAIL CLIENT (SANCTUM)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {

    /** 🔁 Utilisateur courant */
    Route::get('/user', fn (Request $request) => $request->user());

    Route::middleware(['portal_client'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | 👤 PROFIL
    |--------------------------------------------------------------------------
    */
    Route::get('/client/me', [ProfileController::class, 'me']);
    Route::post('/client/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | 🧾 DEVIS (QUOTES)
    |--------------------------------------------------------------------------
    */
    Route::get('/client/quotes',      [QuoteController::class, 'index']);
    Route::get('/client/quotes/{id}', [QuoteController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | 📄 FACTURES (INVOICES)
    |--------------------------------------------------------------------------
    */
    Route::get('/client/invoices',      [InvoiceController::class, 'index']);
    Route::get('/client/invoices/{id}', [InvoiceController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | 🛒 COMMANDES (ORDERS)
    |--------------------------------------------------------------------------
    */
    Route::get('/client/orders',      [OrderController::class, 'index']);
    Route::get('/client/orders/{id}', [OrderController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | 🎫 SUPPORT TICKETS
    |--------------------------------------------------------------------------
    */
    Route::get('/client/tickets',           [SupportTicketController::class, 'index']);
    Route::post('/client/tickets',          [SupportTicketController::class, 'store'])->middleware('throttle:client-tickets');
    Route::get('/client/tickets/{id}',      [SupportTicketController::class, 'show']);
    Route::post('/client/tickets/{id}/reply', [SupportTicketController::class, 'reply'])->middleware('throttle:client-tickets');

    /*
    |--------------------------------------------------------------------------
    | 📎 DOCUMENTS PRODUITS (MODE CONNECTÉ)
    |--------------------------------------------------------------------------
    */
    Route::get('/client/products/{id}/documents', [
        ProductDocumentController::class,
        'index'
    ]);

    /*
    |--------------------------------------------------------------------------
    | 🛠 CONFIGURATEUR VISUEL (SAVE CONFIG)
    |--------------------------------------------------------------------------
    */
    Route::post('/client/configurator', [
        ProductConfigController::class,
        'store'
    ])->middleware('throttle:client-config');

    });
});



/*
|--------------------------------------------------------------------------
| API BACK-OFFICE — ATTRIBUTS CATEGORIES
|--------------------------------------------------------------------------
*/

Route::get('/categories/{category}/attributes', [
    CategoryController::class,
    'apiAttributes'
])->name('api.categories.attributes');


/*
|--------------------------------------------------------------------------
| API BACK-OFFICE v1 (authentifiée)
|--------------------------------------------------------------------------
|
| Objectif: exposer les données du backend à un front (admin/backoffice).
| - Auth: Sanctum
| - Autorisation: rôle Admin/SuperAdmin (Spatie)
| - Pagination: ?page=1&per_page=20 (borné à 100)
| - Filtres simples: ?search=... + filtres spécifiques par ressource
| - Includes contrôlés: ?with=relation1,relation2
|
*/

Route::prefix('v1')
    ->middleware(['auth:sanctum', 'role:Admin|SuperAdmin'])
    ->group(function () {

        // Référentiels
        Route::get('/brands', [V1BrandController::class, 'index']);
        Route::get('/brands/{id}', [V1BrandController::class, 'show']);

        Route::get('/currencies', [V1CurrencyController::class, 'index']);
        Route::get('/currencies/{code}', [V1CurrencyController::class, 'show']);

        Route::get('/tax-rates', [V1TaxRateController::class, 'index']);
        Route::get('/tax-rates/{id}', [V1TaxRateController::class, 'show']);

        // Clients
        Route::get('/clients', [V1ClientController::class, 'index']);
        Route::get('/clients/{id}', [V1ClientController::class, 'show']);

        // Fournisseurs
        Route::get('/providers', [V1ProviderController::class, 'index']);
        Route::get('/providers/{id}', [V1ProviderController::class, 'show']);

        // Catégories
        Route::get('/categories', [V1CategoryController::class, 'index']);
        Route::get('/categories/{id}', [V1CategoryController::class, 'show']);

        // Produits
        Route::get('/products', [V1ProductController::class, 'index']);
        Route::get('/products/{id}', [V1ProductController::class, 'show']);

        Route::get('/product-variants', [V1ProductVariantController::class, 'index']);
        Route::get('/product-variants/{id}', [V1ProductVariantController::class, 'show']);

        Route::get('/product-images', [V1ProductImageController::class, 'index']);
        Route::get('/product-images/{id}', [V1ProductImageController::class, 'show']);

        Route::get('/price-histories', [V1PriceHistoryController::class, 'index']);
        Route::get('/price-histories/{id}', [V1PriceHistoryController::class, 'show']);

        // Promotions
        Route::get('/promotions', [V1PromotionController::class, 'index']);
        Route::get('/promotions/{id}', [V1PromotionController::class, 'show']);

        Route::get('/promotion-codes', [V1PromotionCodeController::class, 'index']);
        Route::get('/promotion-codes/{id}', [V1PromotionCodeController::class, 'show']);

        // Devis
        Route::get('/quotes', [V1QuoteController::class, 'index']);
        Route::get('/quotes/{id}', [V1QuoteController::class, 'show']);

        // Factures
        Route::get('/invoices', [V1InvoiceController::class, 'index']);
        Route::get('/invoices/{id}', [V1InvoiceController::class, 'show']);

        // Commandes
        Route::get('/orders', [V1OrderController::class, 'index']);
        Route::get('/orders/{id}', [V1OrderController::class, 'show']);

        // Stock
        Route::get('/stock-movements', [V1StockMovementController::class, 'index']);
        Route::get('/stock-movements/{id}', [V1StockMovementController::class, 'show']);

        Route::get('/stock-movement-reasons', [V1StockMovementReasonController::class, 'index']);
        Route::get('/stock-movement-reasons/{id}', [V1StockMovementReasonController::class, 'show']);

        Route::get('/stock-movement-attachments', [V1StockMovementAttachmentController::class, 'index']);
        Route::get('/stock-movement-attachments/{id}', [V1StockMovementAttachmentController::class, 'show']);

        // RH
        Route::get('/departments', [V1DepartmentController::class, 'index']);
        Route::get('/departments/{id}', [V1DepartmentController::class, 'show']);

        Route::get('/employees', [V1EmployeeController::class, 'index']);
        Route::get('/employees/{id}', [V1EmployeeController::class, 'show']);

        Route::get('/leave-types', [V1LeaveTypeController::class, 'index']);
        Route::get('/leave-types/{id}', [V1LeaveTypeController::class, 'show']);

        Route::get('/leave-balances', [V1LeaveBalanceController::class, 'index']);
        Route::get('/leave-balances/{id}', [V1LeaveBalanceController::class, 'show']);

        Route::get('/leave-requests', [V1LeaveRequestController::class, 'index']);
        Route::get('/leave-requests/{id}', [V1LeaveRequestController::class, 'show']);

        Route::get('/holidays', [V1HolidayController::class, 'index']);
        Route::get('/holidays/{id}', [V1HolidayController::class, 'show']);
    });
