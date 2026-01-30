<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\StockMovementReason;
use App\Models\User;
use Database\Seeders\CurrencySeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxRateSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


test('superadmin peut créer / modifier / supprimer un mouvement de stock', function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);
    \Pest\Laravel\seed(CurrencySeeder::class);
    \Pest\Laravel\seed(TaxRateSeeder::class);

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('SuperAdmin');
    \Pest\Laravel\actingAs($user);

    // Produit minimal
    $category = Category::factory()->create(['is_active' => true]);

    Model::unguard();
    $product = Product::query()->create([
        'id' => (string) Str::uuid(),
        'name' => 'Produit Stock',
        'slug' => 'produit-stock-' . Str::lower(Str::random(8)),
        'sku' => 'SKU-' . Str::upper(Str::random(8)),
        'price' => 10.00,
        'currency_code' => 'MAD',
        'tax_rate_id' => 1,
        'category_id' => $category->id,
        'type' => 'physical',
        'visibility' => 'public',
        'is_active' => true,
        'stock_quantity' => 0,
        'created_by' => $user->id,
    ]);

    $reason = StockMovementReason::query()->create([
        'name' => 'Achat',
        'type' => 'in',
        'description' => null,
        'is_active' => true,
    ]);
    Model::reguard();

    \Pest\Laravel\post(route('stock-movements.store', absolute: false), [
        'product_id' => (string) $product->id,
        'type' => 'in',
        'quantity' => 5,
        'reference' => 'REF-TEST',
        'provider_id' => null,
        'reason_id' => $reason->id,
        'unit_cost' => 2.50,
        'currency_code' => 'MAD',
        'notes' => 'note',
        'movement_date' => now()->toDateTimeString(),
    ])->assertRedirect(route('stock-movements.index', absolute: false));

    $movement = StockMovement::query()->firstOrFail();
    expect($movement->product_id)->toBe((string) $product->id);

    \Pest\Laravel\patch(route('stock-movements.update', $movement, absolute: false), [
        'product_id' => (string) $product->id,
        'type' => 'adjustment',
        'quantity' => 3,
        'reference' => 'REF-TEST-2',
        'provider_id' => null,
        'reason_id' => $reason->id,
        'unit_cost' => 2.00,
        'currency_code' => 'MAD',
        'notes' => 'note 2',
        'movement_date' => now()->toDateTimeString(),
    ])->assertRedirect(route('stock-movements.index', absolute: false));

    $movement->refresh();
    expect($movement->type)->toBe('adjustment');

    \Pest\Laravel\delete(route('stock-movements.destroy', $movement, absolute: false))
        ->assertStatus(302);

    expect(StockMovement::withTrashed()->find($movement->id))->not()->toBeNull();
});
