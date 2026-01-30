import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';

import type { Product } from '../types';
import { Button } from './Button';
import { createOrder } from '../utils/apiOrders';

type Props = {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
};

export const CheckoutModal: React.FC<Props> = ({ product, isOpen, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);

  const canOrder = useMemo(() => {
    return product.price && product.price !== 'price_on_request';
  }, [product.price]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!canOrder) {
      setSubmitError('Ce produit est disponible uniquement sur devis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createOrder({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        shipping_address: {
          address1: address1.trim(),
          address2: address2.trim() || undefined,
          city: city.trim(),
          postal_code: postalCode.trim() || undefined,
          country: 'Maroc',
        },
        items: [{ product_id: product.id, quantity }],
        notes: notes.trim() || undefined,
      });

      if (!res.success || !res.order) {
        throw new Error(res.message || 'Impossible de créer la commande.');
      }

      setSuccessOrderNumber(res.order.order_number);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la commande.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAndReset = () => {
    setSubmitError(null);
    setIsSubmitting(false);
    setSuccessOrderNumber(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeAndReset} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Commander (paiement à la livraison)</h3>
            <p className="text-xs text-gray-500 mt-1">Produit: <span className="font-medium">{product.name}</span></p>
          </div>
          <button onClick={closeAndReset} className="p-2 rounded hover:bg-gray-100" aria-label="Fermer">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {successOrderNumber ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="text-green-800 font-bold">Commande enregistrée</div>
              <div className="text-green-700 text-sm mt-1">Référence: <span className="font-semibold">{successOrderNumber}</span></div>
              <div className="text-gray-600 text-sm mt-3">Un conseiller confirmera la livraison par téléphone.</div>
              <div className="mt-5">
                <Button type="button" onClick={closeAndReset} className="w-full">Fermer</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complément d’adresse (optionnel)</label>
                  <input
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code postal (optionnel)</label>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note (optionnel)</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                    placeholder="Ex: créneau de livraison, instructions..."
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col md:flex-row gap-3">
                <Button type="button" variant="outline" className="w-full" onClick={closeAndReset} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Envoi…' : 'Commander'}
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                Paiement à la livraison (Cash On Delivery). Aucune transaction en ligne.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
