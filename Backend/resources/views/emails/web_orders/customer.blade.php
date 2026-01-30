@php
  /** @var \App\Models\WebOrder $order */
  /** @var string|null $trackingUrl */
@endphp

<!doctype html>
<html lang="fr">
  <body style="font-family: Arial, sans-serif; line-height: 1.4;">
    <h2>Merci pour votre commande</h2>
    <p>Bonjour {{ $order->customer_name }},</p>

    <p>Votre commande <strong>{{ $order->order_number }}</strong> a bien été enregistrée.</p>

    <p>
      <strong>Référence:</strong> {{ $order->order_number }}<br>
      <strong>Date:</strong> {{ optional($order->created_at)->format('d/m/Y H:i') }}<br>
      <strong>Paiement:</strong> à la livraison (COD)
    </p>

    <div style="background:#f7f7f7;padding:12px;border-radius:8px;">
      <div><strong>Sous-total HT:</strong> {{ number_format((float) $order->subtotal_ht, 2, '.', ' ') }} {{ $order->currency_code }}</div>
      <div><strong>TVA:</strong> {{ number_format((float) $order->total_tax, 2, '.', ' ') }} {{ $order->currency_code }}</div>
      <div style="margin-top:6px;"><strong>Total TTC:</strong> {{ number_format((float) $order->total_ttc, 2, '.', ' ') }} {{ $order->currency_code }}</div>
    </div>

    <h3>Détails</h3>
    <ul>
      @foreach($order->items as $item)
        <li>
          {{ $item->product_name_snapshot }}
          @if($item->product_sku_snapshot)
            (SKU: {{ $item->product_sku_snapshot }})
          @endif
          — Qté: {{ $item->quantity }}
          — Total: {{ number_format((float) $item->line_total_ttc, 2, '.', ' ') }} {{ $order->currency_code }}
        </li>
      @endforeach
    </ul>

    <h3>Adresse de livraison</h3>
    <p>
      {{ data_get($order->shipping_address, 'address1') }}<br>
      @if(data_get($order->shipping_address, 'address2'))
        {{ data_get($order->shipping_address, 'address2') }}<br>
      @endif
      {{ data_get($order->shipping_address, 'postal_code') ? data_get($order->shipping_address, 'postal_code') . ' ' : '' }}{{ data_get($order->shipping_address, 'city') }}<br>
      {{ data_get($order->shipping_address, 'country') ?: '—' }}
    </p>

    @if(!empty($trackingUrl))
      <p>
        Suivre votre commande: <a href="{{ $trackingUrl }}">{{ $trackingUrl }}</a><br>
        (Vous aurez besoin de votre email: <strong>{{ $order->customer_email }}</strong>)
      </p>
    @endif

    <p>Nous vous contacterons si besoin pour confirmer la livraison.</p>

    <p style="margin-top: 24px; color: #666; font-size: 12px;">
      Ceci est un email automatique.
    </p>
  </body>
</html>
