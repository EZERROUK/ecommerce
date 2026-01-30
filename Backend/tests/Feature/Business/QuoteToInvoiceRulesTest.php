<?php

use App\Models\Category;
use App\Models\Client;
use App\Models\Currency;
use App\Models\Product;
use App\Models\Quote;
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

it('refuse la conversion en facture si le devis n\'est pas accepté', function () {
    $client = Client::query()->create([
        'company_name' => 'Client',
        'email' => 'conv-client@example.com',
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
        'slug' => 'cat-conv',
        'created_by' => Auth::id(),
    ]);

    $currency = Currency::query()->firstOrFail();
    $taxRate = TaxRate::query()->firstOrFail();

    $product = Product::query()->create([
        'name' => 'Produit',
        'slug' => 'produit-conv',
        'sku' => 'SKU-CONV-1',
        'category_id' => $category->id,
        'currency_code' => $currency->code,
        'tax_rate_id' => $taxRate->id,
        'price' => 10,
        'type' => 'physical',
        'visibility' => 'public',
        'stock_quantity' => 0,
        'created_by' => Auth::id(),
    ]);

    $quote = Quote::query()->create([
        'client_id' => $client->id,
        'user_id' => Auth::id(),
        'quote_date' => now()->toDateString(),
        'valid_until' => now()->addDays(7)->toDateString(),
        'currency_code' => $currency->code,
        'status' => 'draft',
        'discount_total' => 0,
        'applied_promotions' => [],
        'client_snapshot' => $client->toSnapshot(),
    ]);

    $quote->items()->create([
        'product_id' => $product->id,
        'product_name_snapshot' => $product->name,
        'product_sku_snapshot' => $product->sku,
        'unit_price_ht_snapshot' => 10,
        'tax_rate_snapshot' => 20,
        'quantity' => 1,
        'sort_order' => 0,
        'discount_amount' => 0,
    ]);

    \Pest\Laravel\post(route('quotes.convert-to-invoice', $quote, absolute: false), [
        'invoice_date' => now()->toDateString(),
        'invoice_due_date' => now()->addDays(30)->toDateString(),
    ])->assertRedirect(route('quotes.show', $quote, absolute: false))
      ->assertSessionHas('error');
});
