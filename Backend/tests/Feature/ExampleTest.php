<?php

it('returns a successful response', function () {
    \App\Models\AppSetting::query()->create([
        'is_configured' => true,
        'company_name' => 'Test Company',
    ]);

    $response = \Pest\Laravel\get('/');

    $response->assertRedirect(route('login', absolute: false));
});
