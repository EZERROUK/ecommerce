<?php

use App\Models\Category;
use App\Models\Client;
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

it('refuse un devis sans items', function () {
    $client = Client::query()->create([
        'company_name' => 'Client',
        'email' => 'quote-client@example.com',
        'address' => 'Adresse',
        'city' => 'Ville',
        'country' => 'Pays',
        'tax_regime' => 'normal',
        'is_tva_subject' => true,
        'is_active' => true,
        'created_by' => Auth::id(),
    ]);

    $currency = Currency::query()->firstOrFail();

    \Pest\Laravel\post(route('quotes.store', absolute: false), [
        'client_id' => $client->id,
        'quote_date' => now()->toDateString(),
        'valid_until' => now()->addDay()->toDateString(),
        'currency_code' => $currency->code,
        'items' => [],
    ])->assertSessionHasErrors(['items']);
});

it('valide valid_until après quote_date', function () {
    $client = Client::query()->create([
        'company_name' => 'Client2',
        'email' => 'quote-client2@example.com',
        'address' => 'Adresse',
        'city' => 'Ville',
        'country' => 'Pays',
        'tax_regime' => 'normal',
        'is_tva_subject' => true,
        'is_active' => true,
        'created_by' => Auth::id(),
    ]);

    $category = Category::query()->create([
        'name' => 'Cat',
        'slug' => 'cat-quote',
        'created_by' => Auth::id(),
    ]);

    $currency = Currency::query()->firstOrFail();
    $taxRate = TaxRate::query()->firstOrFail();

    $product = Product::query()->create([
        'name' => 'Produit',
        'slug' => 'produit-quote',
        'sku' => 'SKU-QUOTE-1',
        'category_id' => $category->id,
        'currency_code' => $currency->code,
        'tax_rate_id' => $taxRate->id,
        'price' => 10,
        'type' => 'physical',
        'visibility' => 'public',
        'stock_quantity' => 0,
        'created_by' => Auth::id(),
    ]);

    \Pest\Laravel\post(route('quotes.store', absolute: false), [
        'client_id' => $client->id,
        'quote_date' => now()->toDateString(),
        'valid_until' => now()->subDay()->toDateString(),
        'currency_code' => $currency->code,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price_ht' => 10,
                'tax_rate' => 20,
            ]
        ],
    ])->assertSessionHasErrors(['valid_until']);
});
