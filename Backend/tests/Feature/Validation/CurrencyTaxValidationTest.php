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

it('valide les champs requis devise', function () {
    \Pest\Laravel\post(route('currencies.store', absolute: false), [])
        ->assertSessionHasErrors(['code', 'symbol', 'name']);
});

it('refuse un taux de taxe > 100', function () {
    \Pest\Laravel\post(route('taxrates.store', absolute: false), [
        'name' => 'TVA',
        'rate' => 101,
    ])->assertSessionHasErrors(['rate']);
});
