<?php

use App\Models\Category;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Product;
use App\Models\Quote;
use App\Models\User;
use Database\Seeders\CurrencySeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxRateSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


function createMinimalProductForInvoice(User $user): Product
{
    $category = Category::factory()->create(['is_active' => true]);

    $uuid = (string) Str::uuid();
    $sku = 'SKU-' . Str::upper(Str::random(8));

    Model::unguard();
    $product = Product::query()->create([
        'id' => $uuid,
        'name' => 'Produit Facture',
        'slug' => 'produit-facture-' . Str::lower(Str::random(8)),
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

test('superadmin peut convertir un devis accepté en facture', function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);
    \Pest\Laravel\seed(CurrencySeeder::class);
    \Pest\Laravel\seed(TaxRateSeeder::class);

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('SuperAdmin');
    \Pest\Laravel\actingAs($user);

    $email = 'client-invoice-' . uniqid() . '@example.com';
    \Pest\Laravel\post(route('clients.store', absolute: false), [
        'company_name' => 'Client Facture',
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
    ]);

    $client = Client::query()->where('email', $email)->firstOrFail();
    $product = createMinimalProductForInvoice($user);

    \Pest\Laravel\post(route('quotes.store', absolute: false), [
        'client_id' => $client->id,
        'quote_date' => now()->toDateString(),
        'valid_until' => now()->addDay()->toDateString(),
        'currency_code' => 'MAD',
        'items' => [
            [
                'product_id' => (string) $product->id,
                'quantity' => 1,
                'unit_price_ht' => 100.00,
                'tax_rate' => 20,
            ],
        ],
    ]);

    $quote = Quote::query()->latest('id')->firstOrFail();

    // La conversion impose status=accepted ; on le force pour tester le flux sans dépendre des transitions UI
    $quote->update(['status' => 'accepted']);

    expect(Invoice::count())->toBe(0);
    expect(InvoiceLine::count())->toBe(0);

    \Pest\Laravel\post(route('quotes.convert-to-invoice', $quote, absolute: false), [
        'invoice_date' => now()->toDateString(),
        'invoice_due_date' => now()->addDays(30)->toDateString(),
        'invoice_notes' => 'Note facture',
    ])->assertRedirect(route('quotes.show', $quote, absolute: false));

    expect(Invoice::count())->toBe(1);
    expect(InvoiceLine::count())->toBe(1);

    $invoice = Invoice::query()->firstOrFail();
    expect($invoice->client_id)->toBe($client->id);
});
