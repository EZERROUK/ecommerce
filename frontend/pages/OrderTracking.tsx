import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { trackOrder } from '../utils/apiOrders';
import { SEO } from '../components/SEO';

export const OrderTracking: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await trackOrder({ orderNumber: orderNumber.trim(), email: email.trim() });
      if (!res.success || !res.order) {
        throw new Error(res.message || 'Commande introuvable.');
      }
      setResult(res.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du suivi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO
        title="Suivre ma commande"
        description="Suivez l’état de votre commande X-Zone."
        noIndex
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-corporate-blue">Suivre ma commande</h1>
        <p className="text-gray-600 mt-2">Saisissez votre référence et l’email utilisé lors de la commande.</p>

        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
          {error && <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700">Référence (ex: WEB-20260117-ABC123)</label>
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded px-3 py-2"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={isLoading || !orderNumber.trim() || !email.trim()}
            className="mt-5 inline-flex items-center justify-center px-5 py-2 bg-corporate-red text-white rounded hover:bg-red-700 disabled:opacity-60"
          >
            {isLoading ? 'Recherche…' : 'Suivre'}
          </button>
        </div>

        {result && (
          <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-600">Commande</div>
                <div className="text-lg font-bold text-gray-900">{result.order_number}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Statut</div>
                <div className="font-semibold text-corporate-blue">{result.status}</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-700">
              <div><span className="text-gray-500">Date:</span> {new Date(result.created_at).toLocaleString('fr-FR')}</div>
              <div><span className="text-gray-500">Paiement:</span> à la livraison (COD)</div>
              {result.shipping_address?.city && (
                <div><span className="text-gray-500">Livraison:</span> {result.shipping_address.city}{result.shipping_address.country ? `, ${result.shipping_address.country}` : ''}</div>
              )}
            </div>

            <div className="mt-5">
              <h2 className="font-semibold text-gray-900 mb-2">Articles</h2>
              <div className="space-y-2">
                {result.items?.map((it: any, idx: number) => (
                  <div key={idx} className="flex items-start justify-between gap-4 text-sm bg-gray-50 border border-gray-100 rounded p-3">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-gray-500">Qté: {it.quantity}{it.sku ? ` • SKU: ${it.sku}` : ''}</div>
                    </div>
                    <div className="font-semibold">{Number(it.line_total_ttc).toLocaleString()} {result.currency_code || 'MAD'}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-between">
                <div className="font-semibold text-gray-900">Total TTC</div>
                <div className="font-bold text-corporate-blue">{Number(result.total_ttc).toLocaleString()} {result.currency_code || 'MAD'}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <Link to="/contact" className="text-corporate-red hover:underline">Besoin d’aide ? Contactez-nous</Link>
        </div>
      </div>
    </div>
  );
};
