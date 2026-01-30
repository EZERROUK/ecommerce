<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\CurrencySeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxRateSeeder;
use Illuminate\Support\Str;


test('superadmin peut créer / modifier / supprimer un produit', function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);
    \Pest\Laravel\seed(CurrencySeeder::class);
    \Pest\Laravel\seed(TaxRateSeeder::class);

    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $user->assignRole('SuperAdmin');

    \Pest\Laravel\actingAs($user);

    $category = Category::factory()->create(['is_active' => true]);

    $sku = 'SKU-' . Str::upper(Str::random(8));

    \Pest\Laravel\post(route('products.store', absolute: false), [
        'name' => 'Produit Test',
        'sku' => $sku,
        'category_id' => $category->id,
        'currency_code' => 'MAD',
        'tax_rate_id' => 1,
        'price' => 100.00,
        'type' => 'physical',
        'visibility' => 'public',
        'stock_quantity' => 0,
    ])->assertRedirect(route('products.index', absolute: false));

    $product = Product::query()->where('sku', $sku)->firstOrFail();

    \Pest\Laravel\patch(route('products.update', $product, absolute: false), [
        'name' => 'Produit Test Modifié',
        'sku' => $sku,
        'category_id' => $category->id,
        'currency_code' => 'MAD',
        'tax_rate_id' => 1,
        'price' => 120.00,
        'type' => 'physical',
        'visibility' => 'public',
        'stock_quantity' => 5,
    ])->assertRedirect(route('products.show', $product, absolute: false));

    $product->refresh();
    expect($product->name)->toBe('Produit Test Modifié');
    expect((float) $product->price)->toBe(120.00);

    \Pest\Laravel\delete(route('products.destroy', $product, absolute: false))
        ->assertStatus(302);

    expect(Product::withTrashed()->find($product->id))->not()->toBeNull();
    expect(Product::withTrashed()->find($product->id)?->deleted_at)->not()->toBeNull();
});
