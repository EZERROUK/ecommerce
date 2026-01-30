<?php

use App\Models\Category;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Auth;

beforeEach(function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);

    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    $user->assignRole('SuperAdmin');

    \Pest\Laravel\actingAs($user);
});

it('valide le nom requis à la création', function () {
    \Pest\Laravel\post(route('categories.store', absolute: false), [])
        ->assertSessionHasErrors(['name']);
});

it('valide le format du slug', function () {
    \Pest\Laravel\post(route('categories.store', absolute: false), [
        'name' => 'Categorie Test',
        'slug' => 'slug invalide',
    ])->assertSessionHasErrors(['slug']);
});

it("refuse une catégorie comme parent d'elle-même", function () {
    $userId = Auth::id();

    $category = Category::query()->create([
        'name' => 'Parent Test',
        'slug' => 'parent-test',
        'created_by' => $userId,
    ]);

    \Pest\Laravel\patch(route('categories.update', $category, absolute: false), [
        'name' => 'Parent Test',
        'parent_id' => $category->id,
    ])->assertSessionHasErrors(['parent_id']);
});
