<?php

use App\Models\Category;
use App\Models\Client;
use App\Models\Product;
use App\Models\Quote;
use App\Models\User;
use Database\Seeders\CurrencySeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxRateSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


function createMinimalProductForQuote(User $user): Product
{
    $category = Category::factory()->create(['is_active' => true]);

    $uuid = (string) Str::uuid();
    $sku = 'SKU-' . Str::upper(Str::random(8));

    Model::unguard();
    $product = Product::query()->create([
        'id' => $uuid,
        'name' => 'Produit Devis',
        'slug' => 'produit-devis-' . Str::lower(Str::random(8)),
        'sku' => $sku,
        'price' => 100.00,
        'currency_code' => 'MAD',
        'tax_rate_id' => 1,
        'category_id' => $category->id,
        'type' => 'physical',
        'visibility' => 'public',
        'is_active' => true,
        'stock_quantity' => 0,
        'created_by' => $user->id,
    ]);
    Model::reguard();

    return $product;
}

test('superadmin peut créer / modifier / supprimer un devis', function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);
    \Pest\Laravel\seed(CurrencySeeder::class);
    \Pest\Laravel\seed(TaxRateSeeder::class);

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('SuperAdmin');
    \Pest\Laravel\actingAs($user);

    // Crée un client via la route (pour avoir created_by correctement)
    $email = 'client-quote-' . uniqid() . '@example.com';
    \Pest\Laravel\post(route('clients.store', absolute: false), [
        'company_name' => 'Client Devis',
        'contact_name' => 'Contact',
        'email' => $email,
        'phone' => '0600000000',
        'address' => 'Adresse test',
        'city' => 'Casablanca',
        'postal_code' => '20000',
        'country' => 'Maroc',
        'ice' => null,
        'rc' => null,
        'patente' => null,
        'cnss' => null,
        'if_number' => null,
        'tax_regime' => 'normal',
        'is_tva_subject' => true,
        'is_active' => true,
        'notes' => null,
    ])->assertRedirect(route('clients.index', absolute: false));

    $client = Client::query()->where('email', $email)->firstOrFail();
    $product = createMinimalProductForQuote($user);

    $quoteDate = now()->toDateString();
    $validUntil = now()->addDay()->toDateString();

    \Pest\Laravel\post(route('quotes.store', absolute: false), [
        'client_id' => $client->id,
        'quote_date' => $quoteDate,
        'valid_until' => $validUntil,
        'currency_code' => 'MAD',
        'terms_conditions' => null,
        'notes' => 'Note devis',
        'internal_notes' => null,
        'items' => [
            [
                'product_id' => (string) $product->id,
                'quantity' => 2,
                'unit_price_ht' => 100.00,
                'tax_rate' => 20,
            ],
        ],
    ])->assertRedirect();

    $quote = Quote::query()->latest('id')->firstOrFail();
    expect($quote->client_id)->toBe($client->id);
    expect($quote->status)->toBe('draft');
    expect($quote->items()->count())->toBe(1);

    \Pest\Laravel\patch(route('quotes.update', $quote, absolute: false), [
        'client_id' => $client->id,
        'quote_date' => $quoteDate,
        'valid_until' => $validUntil,
        'currency_code' => 'MAD',
        'terms_conditions' => null,
        'notes' => 'Note devis modifiée',
        'internal_notes' => null,
        'items' => [
            [
                'product_id' => (string) $product->id,
                'quantity' => 3,
                'unit_price_ht' => 110.00,
                'tax_rate' => 20,
            ],
        ],
    ])->assertRedirect(route('quotes.show', $quote, absolute: false));

    $quote->refresh();
    expect($quote->items()->count())->toBe(1);
    expect($quote->notes)->toBe('Note devis modifiée');

    \Pest\Laravel\delete(route('quotes.destroy', $quote, absolute: false))
        ->assertRedirect(route('quotes.index', absolute: false));

    expect(Quote::withTrashed()->find($quote->id))->not()->toBeNull();
    expect(Quote::withTrashed()->find($quote->id)?->deleted_at)->not()->toBeNull();
});
