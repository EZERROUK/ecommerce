<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Commandes web (boutique)
    |--------------------------------------------------------------------------
    |
    | Email admin qui reçoit la notification lors d'une commande.
    | Si null, fallback sur mail.from.address.
    |
    */

    'admin_email' => env('WEB_ORDERS_ADMIN_EMAIL'),

    /*
    |--------------------------------------------------------------------------
    | URL publique (front) + suivi commande
    |--------------------------------------------------------------------------
    |
    | Sert à générer un lien dans l'email client vers la page de suivi.
    | Exemple: https://xzone.ma
    |
    */

    'public_url' => env('WEB_ORDERS_PUBLIC_URL', env('APP_URL')),

    // Front en HashRouter: /#/order-tracking
    'public_tracking_path' => env('WEB_ORDERS_TRACKING_PATH', '#/order-tracking'),
];
