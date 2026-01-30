<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);
});

it("retourne 403 si l'utilisateur n'a pas la permission", function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    \Pest\Laravel\actingAs($user);

    \Pest\Laravel\get(route('categories.index', absolute: false))->assertForbidden();
    \Pest\Laravel\get(route('products.index', absolute: false))->assertForbidden();
});
