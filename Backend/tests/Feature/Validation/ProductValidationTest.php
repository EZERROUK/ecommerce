<?php

use App\Models\Category;
use App\Models\Currency;
use App\Models\Product;
use App\Models\TaxRate;
use App\Models\User;
use Database\Seeders\CurrencySeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxRateSeeder;
use Illuminate\Support\Facades\Auth;

beforeEach(function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);
    \Pest\Laravel\seed(CurrencySeeder::class);
    \Pest\Laravel\seed(TaxRateSeeder::class);

    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $user->assignRole('SuperAdmin');
    \Pest\Laravel\actingAs($user);
});

it('refuse un produit si les champs requis sont absents', function () {
    \Pest\Laravel\post(route('products.store', absolute: false), [])
        ->assertSessionHasErrors([
            'name',
            'sku',
            'category_id',
            'currency_code',
            'tax_rate_id',
            'price',
            'stock_quantity',
        ]);
});

it('refuse compare_at_price si inférieur au prix', function () {
    $category = Category::query()->create([
        'name' => 'Cat',
        'slug' => 'cat',
        'created_by' => Auth::id(),
    ]);

    $currency = Currency::query()->firstOrFail();
    $taxRate = TaxRate::query()->firstOrFail();

    \Pest\Laravel\post(route('products.store', absolute: false), [
        'name' => 'Produit Test',
        'sku' => 'SKU-TEST-1',
        'category_id' => $category->id,
        'currency_code' => $currency->code,
        'tax_rate_id' => $taxRate->id,
        'price' => 100,
        'compare_at_price' => 50,
        'type' => 'physical',
        'visibility' => 'public',
        'stock_quantity' => 0,
    ])->assertSessionHasErrors(['compare_at_price']);
});

it('refuse une compatibilité avec lui-même (update)', function () {
    $category = Category::query()->create([
        'name' => 'Cat2',
        'slug' => 'cat2',
        'created_by' => Auth::id(),
    ]);

    $currency = Currency::query()->firstOrFail();
    $taxRate = TaxRate::query()->firstOrFail();

    $product = Product::query()->create([
        'name' => 'Produit Base',
        'slug' => 'produit-base',
        'sku' => 'SKU-BASE-1',
        'category_id' => $category->id,
        'currency_code' => $currency->code,
        'tax_rate_id' => $taxRate->id,
        'price' => 10,
        'type' => 'physical',
        'visibility' => 'public',
        'stock_quantity' => 0,
        'created_by' => Auth::id(),
    ]);

    \Pest\Laravel\patch(route('products.update', $product, absolute: false), [
        'name' => $product->name,
        'sku' => $product->sku,
        'category_id' => $product->category_id,
        'currency_code' => $product->currency_code,
        'tax_rate_id' => $product->tax_rate_id,
        'price' => $product->price,
        'type' => $product->type,
        'visibility' => $product->visibility,
        'stock_quantity' => $product->stock_quantity,
        'compatibility_product_ids' => [(string) $product->id],
    ])->assertSessionHasErrors(['compatibility_product_ids']);
});
