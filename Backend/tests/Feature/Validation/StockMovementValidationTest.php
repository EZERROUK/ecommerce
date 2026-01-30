<?php

use App\Models\Category;
use App\Models\Currency;
use App\Models\Product;
use App\Models\StockMovementReason;
use App\Models\TaxRate;
use App\Models\User;
use Database\Seeders\CurrencySeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\StockMovementReasonSeeder;
use Database\Seeders\TaxRateSeeder;
use Illuminate\Support\Facades\Auth;

beforeEach(function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);
    \Pest\Laravel\seed(CurrencySeeder::class);
    \Pest\Laravel\seed(TaxRateSeeder::class);
    \Pest\Laravel\seed(StockMovementReasonSeeder::class);

    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $user->assignRole('SuperAdmin');
    \Pest\Laravel\actingAs($user);
});

it('refuse une quantité zéro pour adjustment', function () {
    $category = Category::query()->create([
        'name' => 'Cat',
        'slug' => 'cat-stock',
        'created_by' => Auth::id(),
    ]);

    $currency = Currency::query()->firstOrFail();
    $taxRate = TaxRate::query()->firstOrFail();

    $product = Product::query()->create([
        'name' => 'Produit Stock',
        'slug' => 'produit-stock',
        'sku' => 'SKU-STOCK-1',
        'category_id' => $category->id,
        'currency_code' => $currency->code,
        'tax_rate_id' => $taxRate->id,
        'price' => 10,
        'type' => 'physical',
        'visibility' => 'public',
        'stock_quantity' => 0,
        'created_by' => Auth::id(),
    ]);

    $reason = StockMovementReason::query()->where('type', 'adjustment')->firstOrFail();

    \Pest\Laravel\post(route('stock-movements.store', absolute: false), [
        'product_id' => $product->id,
        'type' => 'adjustment',
        'quantity' => 0,
        'reason_id' => $reason->id,
        'currency_code' => $currency->code,
        'movement_date' => now()->toDateString(),
    ])->assertSessionHasErrors(['quantity']);
});

it("force une sortie 'out' en négatif si la quantité est positive", function () {
    $category = Category::query()->create([
        'name' => 'Cat2',
        'slug' => 'cat-stock-2',
        'created_by' => Auth::id(),
    ]);

    $currency = Currency::query()->firstOrFail();
    $taxRate = TaxRate::query()->firstOrFail();

    $product = Product::query()->create([
        'name' => 'Produit Stock 2',
        'slug' => 'produit-stock-2',
        'sku' => 'SKU-STOCK-2',
        'category_id' => $category->id,
        'currency_code' => $currency->code,
        'tax_rate_id' => $taxRate->id,
        'price' => 10,
        'type' => 'physical',
        'visibility' => 'public',
        'stock_quantity' => 10,
        'created_by' => Auth::id(),
    ]);

    $reason = StockMovementReason::query()->where('type', 'out')->firstOrFail();

    $response = \Pest\Laravel\post(route('stock-movements.store', absolute: false), [
        'product_id' => $product->id,
        'type' => 'out',
        'quantity' => 5,
        'reason_id' => $reason->id,
        'currency_code' => $currency->code,
        'movement_date' => now()->toDateString(),
    ]);

    $response->assertStatus(302);
});
