<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    /**
     * Retourne le profil complet du client connecté
     */
    public function me(Request $request)
    {
        $user = Auth::user();

        return response()->json([
            'success' => true,
            'data' => new ProfileResource($user),
        ]);
    }
}
