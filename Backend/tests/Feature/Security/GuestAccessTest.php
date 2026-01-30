<?php

use App\Models\AppSetting;

it('redirige vers login quand on est invité (zone protégée)', function () {
    AppSetting::query()->firstOrCreate([
        'is_configured' => true,
    ], [
        'company_name' => 'Test Company',
    ]);

    $login = route('login', absolute: false);

    \Pest\Laravel\get(route('dashboard', absolute: false))->assertRedirect($login);

    \Pest\Laravel\get(route('categories.index', absolute: false))->assertRedirect($login);
    \Pest\Laravel\get(route('products.index', absolute: false))->assertRedirect($login);
    \Pest\Laravel\get(route('clients.index', absolute: false))->assertRedirect($login);
    \Pest\Laravel\get(route('quotes.index', absolute: false))->assertRedirect($login);
    \Pest\Laravel\get(route('stock-movements.index', absolute: false))->assertRedirect($login);
});
