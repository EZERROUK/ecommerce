import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import { SEO } from '../components/SEO';

export const OrderSuccess: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const state = location.state as any;
  const order = state?.order;

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO
        title="Commande confirmée"
        description="Votre commande a bien été enregistrée."
        noIndex
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-14 h-14 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-corporate-blue">Commande confirmée</h1>
          <p className="text-gray-600 mt-2">Merci. Votre commande a bien été enregistrée.</p>

          <div className="mt-6 text-left bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="text-sm text-gray-600">Référence</div>
            <div className="text-lg font-bold text-gray-900">{order?.order_number || orderNumber}</div>
            {order?.total_ttc != null && (
              <div className="mt-2 text-sm text-gray-700">
                Total TTC: <span className="font-semibold">{Number(order.total_ttc).toLocaleString()} {order.currency_code || 'MAD'}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4">Paiement à la livraison (COD). Un conseiller peut vous contacter pour confirmer les détails.</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/produits" className="inline-flex items-center justify-center px-5 py-2 bg-corporate-red text-white rounded hover:bg-red-700">
              <ShoppingBag className="w-4 h-4 mr-2" /> Continuer vos achats
            </Link>
            <Link to="/" className="inline-flex items-center justify-center px-5 py-2 border border-gray-200 rounded hover:bg-gray-50">
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
