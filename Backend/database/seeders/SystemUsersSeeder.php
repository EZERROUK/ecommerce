<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SystemUsersSeeder extends Seeder
{
    public function run(): void
    {
        $this->ensureUser(
            email: env('SEED_SUPERADMIN_EMAIL', 'SuperAdmin@example.com'),
            name: env('SEED_SUPERADMIN_NAME', 'SuperAdmin'),
            role: 'SuperAdmin',
            password: env('SEED_SUPERADMIN_PASSWORD')
        );

        $this->ensureUser(
            email: env('SEED_ADMIN_EMAIL', 'admin@example.com'),
            name: env('SEED_ADMIN_NAME', 'Admin'),
            role: 'Admin',
            password: env('SEED_ADMIN_PASSWORD')
        );

        $this->ensureUser(
            email: env('SEED_USER_EMAIL', 'user@example.com'),
            name: env('SEED_USER_NAME', 'User'),
            role: 'User',
            password: env('SEED_USER_PASSWORD')
        );
    }

    private function ensureUser(string $email, string $name, string $role, ?string $password = null): User
    {
        $password ??= env('SEED_DEFAULT_PASSWORD', 'password123');

        if (app()->environment('production') && $password === 'password123') {
            throw new \RuntimeException(
                'Refus de seeder des comptes système avec un mot de passe par défaut en production. ' .
                'Définis SEED_DEFAULT_PASSWORD ou SEED_*_PASSWORD.'
            );
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );

        $user->syncRoles([$role]);

        return $user;
    }
}
