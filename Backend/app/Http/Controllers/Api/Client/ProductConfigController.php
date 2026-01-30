<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\ProductCustomConfig;
use Illuminate\Http\Request;

class ProductConfigController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|uuid',
            'config'     => 'required|array',
        ]);

        $config = ProductCustomConfig::create([
            'user_id'    => $request->user()->id,
            'product_id' => $request->product_id,
            'config'     => $request->config,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'         => $config->id,
                'product_id' => $config->product_id,
                'config'     => $config->config,
                'created_at' => optional($config->created_at)?->format('Y-m-d H:i'),
            ],
        ]);
    }
}
