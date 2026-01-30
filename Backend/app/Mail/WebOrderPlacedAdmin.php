<?php

namespace App\Mail;

use App\Models\WebOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WebOrderPlacedAdmin extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public WebOrder $order)
    {
        $this->order->loadMissing('items');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[X-Zone] Nouvelle commande web ' . $this->order->order_number,
        );
    }

    public function content(): Content
    {
        $publicUrl = (string) (config('web_orders.public_url') ?: config('app.url'));
        $path = (string) (config('web_orders.public_tracking_path') ?: '#/order-tracking');
        $trackingUrl = rtrim($publicUrl, '/') . '/' . ltrim($path, '/');

        return new Content(
            view: 'emails.web_orders.admin',
            with: [
                'order' => $this->order,
                'trackingUrl' => $trackingUrl,
            ],
        );
    }
}
