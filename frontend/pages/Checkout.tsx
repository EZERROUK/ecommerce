import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { createOrder } from '../utils/apiOrders';
import { SEO } from '../components/SEO';

export const Checkout: React.FC = () => {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Maroc');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (items.length === 0) return false;
    if (!customerName.trim()) return false;
    if (!customerEmail.trim()) return false;
    if (!customerPhone.trim()) return false;
    if (!address1.trim()) return false;
    if (!city.trim()) return false;
    return true;
  }, [items.length, customerName, customerEmail, customerPhone, address1, city]);

  const submit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createOrder({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        shipping_address: {
          address1: address1.trim(),
          address2: address2.trim() ? address2.trim() : undefined,
          city: city.trim(),
          postal_code: postalCode.trim() ? postalCode.trim() : undefined,
          country: country.trim() ? country.trim() : undefined,
        },
        items: items.map((x) => ({ product_id: x.productId, quantity: x.quantity })),
        notes: notes.trim() ? notes.trim() : undefined,
      });

      if (!res.success || !res.order?.order_number) {
        throw new Error(res.message || 'Impossible de créer la commande.');
      }

      clear();
      navigate(`/order-success/${encodeURIComponent(res.order.order_number)}`, {
        state: { order: res.order },
        replace: true,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la commande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <SEO
          title="Passer commande"
          description="Finalisez votre commande X-Zone."
          noIndex
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl font-bold text-corporate-blue mb-4">Passer commande</h1>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-gray-600">Votre panier est vide.</p>
            <div className="mt-4">
              <Link to="/produits" className="text-corporate-red hover:underline">Retour au catalogue</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO
        title="Passer commande"
        description="Finalisez votre commande X-Zone."
        noIndex
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-corporate-blue">Passer commande</h1>
          <Link to="/cart" className="text-sm text-corporate-blue hover:text-corporate-red inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au panier
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Informations de livraison</h2>

            {error && (
              <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700">Nom complet</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 w-full border border-gray-200 rounded px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Téléphone</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-1 w-full border border-gray-200 rounded px-3 py-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-700">Email</label>
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="mt-1 w-full border border-gray-200 rounded px-3 py-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-700">Adresse</label>
                <input value={address1} onChange={(e) => setAddress1(e.target.value)} className="mt-1 w-full border border-gray-200 rounded px-3 py-2" placeholder="Rue, numéro…" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-700">Complément d’adresse (optionnel)</label>
                <input value={address2} onChange={(e) => setAddress2(e.target.value)} className="mt-1 w-full border border-gray-200 rounded px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Ville</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full border border-gray-200 rounded px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Code postal (optionnel)</label>
                <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="mt-1 w-full border border-gray-200 rounded px-3 py-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-700">Pays</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full border border-gray-200 rounded px-3 py-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-700">Notes (optionnel)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full border border-gray-200 rounded px-3 py-2" rows={3} />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">Paiement: <span className="font-semibold">à la livraison (COD)</span></div>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || isSubmitting}
                className="inline-flex items-center justify-center px-5 py-2 bg-corporate-red text-white rounded hover:bg-red-700 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
                Confirmer la commande
              </button>
            </div>
          </div>

          <aside className="bg-white rounded-xl border border-gray-100 p-6 h-fit">
            <h2 className="font-semibold text-gray-900">Résumé</h2>
            <div className="mt-3 space-y-2">
              {items.map((x) => (
                <div key={x.productId} className="flex items-start justify-between gap-3 text-sm">
                  <div className="text-gray-700">{x.name} <span className="text-gray-500">× {x.quantity}</span></div>
                  <div className="text-gray-900 font-medium">{(Number(x.price) * x.quantity || 0).toLocaleString()} MAD</div>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <div className="font-semibold text-gray-900">Sous-total</div>
                <div className="font-bold text-corporate-blue">{subtotal.toLocaleString()} MAD</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Le total TTC final est calculé côté serveur (TVA incluse). Vous verrez la référence après validation.</p>
          </aside>
        </div>
      </div>
    </div>
  );
};
