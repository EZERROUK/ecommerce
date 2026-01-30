<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Login portail client
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect.',
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->portal_client) {
            return response()->json([
                'success' => false,
                'message' => "Vous n'avez pas accès à l'espace client.",
            ], 403);
        }

        $token = $user->createToken('client-portal')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => new ProfileResource($user),
        ]);
    }

    /**
     * Récupération du profil
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user'    => $request->user(),
        ]);
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => "Déconnexion effectuée.",
        ]);
    }
}
