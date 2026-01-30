<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ProductCustomConfig;

class ConfigController extends Controller
{
    /**
     * Enregistre une configuration personnalisée du client
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user->portal_client) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé.',
            ], 403);
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'ram'        => 'nullable|string|max:50',
            'storage'    => 'nullable|string|max:100',
            'processor'  => 'nullable|string|max:100',
            'details'    => 'nullable|array',
        ]);

        $config = ProductCustomConfig::create([
            'user_id' => $user->id,
            'product_id' => $validated['product_id'],
            'ram'       => $validated['ram'] ?? null,
            'storage'   => $validated['storage'] ?? null,
            'processor' => $validated['processor'] ?? null,
            'details'   => $validated['details'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Configuration enregistrée.',
            'config' => $config,
        ]);
    }
}
