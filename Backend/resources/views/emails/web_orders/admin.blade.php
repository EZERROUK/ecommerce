@php
  /** @var \App\Models\WebOrder $order */
  /** @var string|null $trackingUrl */
@endphp

<!doctype html>
<html lang="fr">
  <body style="font-family: Arial, sans-serif; line-height: 1.4;">
    <h2>Nouvelle commande web</h2>

    <p>
      <strong>Référence:</strong> {{ $order->order_number }}<br>
      <strong>Statut:</strong> {{ $order->status }}<br>
      <strong>Date:</strong> {{ optional($order->created_at)->format('d/m/Y H:i') }}<br>
      <strong>Sous-total HT:</strong> {{ number_format((float) $order->subtotal_ht, 2, '.', ' ') }} {{ $order->currency_code }}<br>
      <strong>TVA:</strong> {{ number_format((float) $order->total_tax, 2, '.', ' ') }} {{ $order->currency_code }}<br>
      <strong>Total TTC:</strong> {{ number_format((float) $order->total_ttc, 2, '.', ' ') }} {{ $order->currency_code }}
    </p>

    <h3>Client</h3>
    <p>
      {{ $order->customer_name }}<br>
      {{ $order->customer_email }}<br>
      {{ $order->customer_phone }}
    </p>

    <h3>Articles</h3>
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

    <h3>Livraison</h3>
    <p>
      {{ data_get($order->shipping_address, 'address1') }}<br>
      @if(data_get($order->shipping_address, 'address2'))
        {{ data_get($order->shipping_address, 'address2') }}<br>
      @endif
      {{ data_get($order->shipping_address, 'postal_code') ? data_get($order->shipping_address, 'postal_code') . ' ' : '' }}{{ data_get($order->shipping_address, 'city') }}<br>
      {{ data_get($order->shipping_address, 'country') ?: '—' }}
    </p>

    <p>
      Accès back-office: <a href="{{ url('/web-orders/' . $order->id) }}">Voir la commande</a>
    </p>

    @if(!empty($trackingUrl))
      <p>
        Lien suivi public: <a href="{{ $trackingUrl }}">{{ $trackingUrl }}</a>
      </p>
    @endif
  </body>
</html>
