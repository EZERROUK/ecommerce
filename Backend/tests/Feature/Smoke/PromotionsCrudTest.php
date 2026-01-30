<?php

use App\Models\Promotion;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Str;


test('superadmin peut créer / modifier / supprimer une promotion', function () {
    \Pest\Laravel\seed(RolePermissionSeeder::class);

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('SuperAdmin');
    \Pest\Laravel\actingAs($user);

    $code = 'PROMO' . Str::upper(Str::random(6));

    \Pest\Laravel\post(route('promotions.store', absolute: false), [
        'name' => 'Promo Test',
        'description' => 'Desc',
        'type' => 'order',
        'apply_scope' => 'order',
        'priority' => 100,
        'is_exclusive' => false,
        'is_active' => true,
        'starts_at' => null,
        'ends_at' => null,
        'days_of_week' => null,
        'min_subtotal' => null,
        'min_quantity' => null,
        'stop_further_processing' => false,
        'actions' => [
            [
                'action_type' => 'percent',
                'value' => 10,
                'max_discount_amount' => null,
            ],
        ],
        'code' => $code,
        'category_ids' => [],
        'product_ids' => [],
    ])->assertRedirect(route('promotions.index', absolute: false));

    $promo = Promotion::query()->where('name', 'Promo Test')->firstOrFail();

    \Pest\Laravel\patch(route('promotions.update', $promo, absolute: false), [
        'name' => 'Promo Test Modifiée',
        'actions' => [
            [
                'action_type' => 'fixed',
                'value' => 50,
                'max_discount_amount' => null,
            ],
        ],
        'code' => $code,
    ])->assertStatus(302);

    $promo->refresh();
    expect($promo->name)->toBe('Promo Test Modifiée');

    \Pest\Laravel\delete(route('promotions.destroy', $promo, absolute: false))
        ->assertStatus(302);

    expect(Promotion::withTrashed()->find($promo->id))->not()->toBeNull();
});
