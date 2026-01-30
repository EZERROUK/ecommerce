<?php

use App\Models\Client;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;


test('superadmin peut créer / modifier / supprimer un client', function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);

    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $user->assignRole('SuperAdmin');

    \Pest\Laravel\actingAs($user);

    $email = 'client-' . uniqid() . '@example.com';

    \Pest\Laravel\post(route('clients.store', absolute: false), [
        'company_name' => 'Société Test',
        'contact_name' => 'Contact Test',
        'email' => $email,
        'phone' => '0600000000',
        'address' => '1 rue de test',
        'city' => 'Casablanca',
        'postal_code' => '20000',
        'country' => 'Maroc',
        'ice' => '123456789012345',
        'rc' => 'RC123',
        'patente' => 'PAT123',
        'cnss' => 'CNSS123',
        'if_number' => 'IF123',
        'tax_regime' => 'normal',
        'is_tva_subject' => true,
        'is_active' => true,
        'notes' => 'Note test',
    ])->assertRedirect(route('clients.index', absolute: false));

    $client = Client::query()->where('email', $email)->firstOrFail();

    \Pest\Laravel\patch(route('clients.update', $client, absolute: false), [
        'company_name' => 'Société Test Modifiée',
        'contact_name' => 'Contact Test',
        'email' => $email,
        'phone' => '0600000000',
        'address' => '1 rue de test',
        'city' => 'Casablanca',
        'postal_code' => '20000',
        'country' => 'Maroc',
        'ice' => '123456789012345',
        'rc' => 'RC123',
        'patente' => 'PAT123',
        'cnss' => 'CNSS123',
        'if_number' => 'IF123',
        'tax_regime' => 'normal',
        'is_tva_subject' => true,
        'is_active' => true,
        'notes' => 'Note test',
    ])->assertRedirect(route('clients.index', absolute: false));

    $client->refresh();
    expect($client->company_name)->toBe('Société Test Modifiée');

    \Pest\Laravel\delete(route('clients.destroy', $client, absolute: false))
        ->assertStatus(302);

    expect(Client::withTrashed()->find($client->id))->not()->toBeNull();
    expect(Client::withTrashed()->find($client->id)?->deleted_at)->not()->toBeNull();
});
