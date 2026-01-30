<?php

use App\Models\Category;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;


test('superadmin peut créer / modifier / supprimer une catégorie', function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);

    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $user->assignRole('SuperAdmin');

    \Pest\Laravel\actingAs($user);

    \Pest\Laravel\get(route('categories.index', absolute: false))->assertOk();

    \Pest\Laravel\post(route('categories.store', absolute: false), [
        'name' => 'Catégorie Test',
    ])->assertRedirect(route('categories.index', absolute: false));

    $category = Category::query()->where('name', 'Catégorie Test')->firstOrFail();

    \Pest\Laravel\patch(route('categories.update', $category, absolute: false), [
        'name' => 'Catégorie Test Modifiée',
    ])->assertRedirect(route('categories.show', $category, absolute: false));

    $category->refresh();
    expect($category->name)->toBe('Catégorie Test Modifiée');

    \Pest\Laravel\delete(route('categories.destroy', $category, absolute: false))
        ->assertStatus(302);

    expect(Category::withTrashed()->find($category->id))->not()->toBeNull();
    expect(Category::withTrashed()->find($category->id)?->deleted_at)->not()->toBeNull();
});
