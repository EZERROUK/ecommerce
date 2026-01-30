import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { LazyImage } from '../components/LazyImage';
import { PrefetchLink } from '../components/PrefetchLink';
import { SEO } from '../components/SEO';

export const Cart: React.FC = () => {
  const { items, itemCount, subtotal, removeItem, setQuantity } = useCart();
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO
        title="Panier"
        description="Consultez et validez les articles de votre panier."
        noIndex
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-corporate-blue">Panier</h1>
          <PrefetchLink to="/produits" className="text-sm text-corporate-blue hover:text-corporate-red inline-flex items-center" prefetch="both">
            <ArrowLeft className="w-4 h-4 mr-2" /> Continuer vos achats
          </PrefetchLink>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-gray-600">Votre panier est vide.</p>
            <div className="mt-4">
              <PrefetchLink to="/produits" className="inline-flex items-center px-5 py-2 bg-corporate-red text-white rounded hover:bg-red-700" prefetch="both">
                <ShoppingBag className="w-4 h-4 mr-2" /> Voir le catalogue
              </PrefetchLink>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
                  <LazyImage src={item.image} alt={item.name} className="w-24 h-24 object-contain bg-gray-50 rounded" width={96} height={96} loading="lazy" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-600">{item.price} MAD</div>
                      </div>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-red-600"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <label className="text-sm text-gray-600">Quantité</label>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={item.quantity}
                        onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                        className="w-20 border border-gray-200 rounded px-2 py-1"
                      />
                      <div className="ml-auto font-semibold text-gray-900">
                        {(Number(item.price) * item.quantity || 0).toLocaleString()} MAD
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="bg-white rounded-xl border border-gray-100 p-5 h-fit">
              <div className="text-sm text-gray-600">Articles: {itemCount}</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="font-semibold text-gray-900">Sous-total</div>
                <div className="font-bold text-corporate-blue">{subtotal.toLocaleString()} MAD</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Paiement à la livraison (COD). Frais de livraison calculés après validation.</p>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="mt-4 w-full inline-flex items-center justify-center px-5 py-2 bg-corporate-red text-white rounded hover:bg-red-700"
              >
                <ShoppingBag className="w-4 h-4 mr-2" /> Passer à la caisse
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
