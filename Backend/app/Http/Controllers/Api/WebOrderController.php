<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWebOrderRequest;
use App\Mail\WebOrderPlacedAdmin;
use App\Mail\WebOrderPlacedCustomer;
use App\Models\Product;
use App\Models\WebOrder;
use App\Models\WebOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class WebOrderController extends Controller
{
    public function store(StoreWebOrderRequest $request)
    {
        $payload = $request->validated();

        $itemsPayload = $payload['items'] ?? [];
        $productIds = collect($itemsPayload)->pluck('product_id')->unique()->values();

        $products = Product::query()
            ->with(['taxRate'])
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        // Refuse toute commande sur un produit "prix sur devis" ou sans prix.
        foreach ($itemsPayload as $item) {
            $product = $products->get($item['product_id']);
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produit introuvable.',
                ], 422);
            }

            if ((bool) ($product->is_price_on_request ?? false) || $product->price === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce produit est disponible uniquement sur devis.',
                ], 422);
            }
        }

        $currencyCode = $products->first()?->currency_code ?? 'MAD';

        $order = DB::transaction(function () use ($payload, $itemsPayload, $products, $currencyCode) {
            $order = WebOrder::create([
                'order_number' => $this->generateOrderNumber(),
                'status' => WebOrder::STATUS_PENDING,
                'payment_method' => 'cod',
                'customer_name' => $payload['customer_name'],
                'customer_email' => $payload['customer_email'],
                'customer_phone' => $payload['customer_phone'],
                'shipping_address' => $payload['shipping_address'],
                'currency_code' => $currencyCode,
                'notes' => $payload['notes'] ?? null,
                'subtotal_ht' => 0,
                'total_tax' => 0,
                'total_ttc' => 0,
            ]);

            $subtotal = 0.0;
            $totalTax = 0.0;
            $totalTtc = 0.0;

            foreach (array_values($itemsPayload) as $index => $item) {
                $product = $products->get($item['product_id']);
                $qty = (int) $item['quantity'];

                $unitHt = (float) $product->price;
                $taxRate = (float) optional($product->taxRate)->rate;

                $lineHt = $unitHt * $qty;
                $lineTax = $lineHt * ($taxRate / 100);
                $lineTtc = $lineHt + $lineTax;

                WebOrderItem::create([
                    'web_order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name_snapshot' => $product->name,
                    'product_sku_snapshot' => $product->sku,
                    'unit_price_ht_snapshot' => $unitHt,
                    'tax_rate_snapshot' => $taxRate,
                    'quantity' => $qty,
                    'line_total_ht' => $lineHt,
                    'line_tax_amount' => $lineTax,
                    'line_total_ttc' => $lineTtc,
                    'sort_order' => $index,
                ]);

                $subtotal += $lineHt;
                $totalTax += $lineTax;
                $totalTtc += $lineTtc;
            }

            $order->update([
                'subtotal_ht' => $subtotal,
                'total_tax' => $totalTax,
                'total_ttc' => $totalTtc,
            ]);

            return $order;
        });

        // Emails (best-effort): confirmation client + notification admin.
        try {
            $order->load(['items']);

            Mail::to($order->customer_email)->send(new WebOrderPlacedCustomer($order));

            $adminEmail = config('web_orders.admin_email') ?: config('mail.from.address');
            if ($adminEmail) {
                Mail::to($adminEmail)->send(new WebOrderPlacedAdmin($order));
            }
        } catch (\Throwable $e) {
            Log::warning('WebOrder email sending failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total_ttc' => $order->total_ttc,
                'currency_code' => $order->currency_code,
            ],
        ]);
    }

    /**
     * Suivi commande public (order_number + email).
     * Ne retourne rien si la paire ne correspond pas.
     */
    public function track(Request $request)
    {
        $validated = $request->validate([
            'order_number' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:255'],
        ]);

        $order = WebOrder::query()
            ->where('order_number', $validated['order_number'])
            ->where('customer_email', $validated['email'])
            ->with(['items'])
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Commande introuvable.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'order' => [
                'order_number' => $order->order_number,
                'status' => $order->status,
                'payment_method' => $order->payment_method,
                'created_at' => $order->created_at,
                'subtotal_ht' => $order->subtotal_ht,
                'total_tax' => $order->total_tax,
                'total_ttc' => $order->total_ttc,
                'currency_code' => $order->currency_code,
                'shipping_address' => [
                    'city' => data_get($order->shipping_address, 'city'),
                    'country' => data_get($order->shipping_address, 'country'),
                ],
                'items' => $order->items->map(fn ($it) => [
                    'name' => $it->product_name_snapshot,
                    'sku' => $it->product_sku_snapshot,
                    'quantity' => $it->quantity,
                    'line_total_ttc' => $it->line_total_ttc,
                ])->values(),
            ],
        ]);
    }

    private function generateOrderNumber(): string
    {
        // Exemple: WEB-20260117-AB12CD
        $date = now()->format('Ymd');
        $random = strtoupper(Str::random(6));
        return "WEB-{$date}-{$random}";
    }
}
