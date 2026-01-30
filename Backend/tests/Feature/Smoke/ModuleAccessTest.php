<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;


beforeEach(function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);

    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    $user->assignRole('SuperAdmin');

    \Pest\Laravel\actingAs($user);
});

test('superadmin peut accéder aux modules principaux (index)', function () {
    \Pest\Laravel\get(route('categories.index', absolute: false))->assertOk();
    \Pest\Laravel\get(route('products.index', absolute: false))->assertOk();
    \Pest\Laravel\get(route('clients.index', absolute: false))->assertOk();

    \Pest\Laravel\get(route('quotes.index', absolute: false))->assertOk();
    \Pest\Laravel\get(route('invoices.index', absolute: false))->assertOk();
    \Pest\Laravel\get(route('promotions.index', absolute: false))->assertOk();

    \Pest\Laravel\get(route('stock-movements.index', absolute: false))->assertOk();
});
