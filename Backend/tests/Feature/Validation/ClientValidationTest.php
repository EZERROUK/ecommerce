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

it('valide les champs requis client', function () {
    \Pest\Laravel\post(route('clients.store', absolute: false), [])
        ->assertSessionHasErrors([
            'company_name',
            'email',
            'address',
            'city',
            'country',
            'tax_regime',
        ]);
});

it("valide le format ICE (15 chiffres)", function () {
    \Pest\Laravel\post(route('clients.store', absolute: false), [
        'company_name' => 'Client',
        'email' => 'client@example.com',
        'address' => 'Adresse',
        'city' => 'Ville',
        'country' => 'Pays',
        'tax_regime' => 'normal',
        'ice' => 'ABC',
        'is_tva_subject' => true,
        'is_active' => true,
    ])->assertSessionHasErrors(['ice']);
});
