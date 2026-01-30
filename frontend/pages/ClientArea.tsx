
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, FileText, Settings, LogOut, Package, HelpCircle, Info, 
  Home, DollarSign, Bell, ChevronRight, Download, X as XIcon, Menu, 
  Truck, Check, Clock, Wrench, ArrowLeft, Paperclip, Search, Filter, 
  MoreVertical, Calendar, CreditCard, Shield, Lock, Eye, Send, Plus
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/Button';
import { generatePDF } from '../utils/pdfGenerator';
import { useLanguage } from '../contexts/LanguageContext';

// --- TYPES & MOCK DATA EXTENDED ---

type ViewState = 'list' | 'detail' | 'create' | 'action';

// Expanded Mock Data for Deep Interaction
const MOCK_DATA = {
  stats: [
    { label: "Devis en attente", value: "3", color: "text-orange-600", bg: "bg-orange-50", icon: FileText },
    { label: "Commandes actives", value: "2", color: "text-blue-600", bg: "bg-blue-50", icon: Package },
    { label: "Factures échues", value: "1", color: "text-red-600", bg: "bg-red-50", icon: DollarSign },
    { label: "Tickets support", value: "1", color: "text-purple-600", bg: "bg-purple-50", icon: HelpCircle },
  ],
  quotes: [
    { 
      id: "D-2024-089", date: "12/10/2024", validUntil: "12/11/2024", amount: 45000, status: "En attente", title: "Infrastructure Serveurs Dell", 
      client: "TechSolutions", items: [{ desc: "Serveur Dell PowerEdge R750", qty: 2, price: 20000 }, { desc: "Installation & Config", qty: 1, price: 5000 }] 
    },
    { 
      id: "D-2024-092", date: "15/10/2024", validUntil: "15/11/2024", amount: 12500, status: "Validé", title: "Renouvellement Licences M365", 
      client: "TechSolutions", items: [{ desc: "Microsoft 365 Business Std", qty: 25, price: 500 }] 
    },
    { 
      id: "D-2024-075", date: "01/09/2024", validUntil: "01/10/2024", amount: 8200, status: "Refusé", title: "Imprimantes HP Laserjet", 
      client: "TechSolutions", items: [{ desc: "HP LaserJet Pro M404dn", qty: 2, price: 4100 }] 
    },
  ],
  orders: [
    { 
      id: "CMD-8832", date: "16/10/2024", status: "En préparation", amount: 12500, title: "Licences Microsoft 365",
      steps: [
        { label: "Commande validée", date: "16/10/2024 09:00", done: true },
        { label: "Paiement reçu", date: "16/10/2024 14:00", done: true },
        { label: "Préparation / Provisioning", date: "En cours", done: false, current: true },
        { label: "Livraison / Activation", date: "Estimé 18/10", done: false }
      ]
    },
    { 
      id: "CMD-8810", date: "05/10/2024", status: "Livrée", amount: 45000, title: "Serveurs Dell PowerEdge",
      steps: [
        { label: "Commande validée", date: "05/10/2024", done: true },
        { label: "Expédition", date: "07/10/2024", done: true },
        { label: "Livraison Site A", date: "08/10/2024", done: true }
      ]
    },
  ],
  invoices: [
    { id: "F-2024-1002", date: "01/10/2024", due: "30/10/2024", amount: 12500, status: "Payée", items: "Licences Octobre" },
    { id: "F-2024-0955", date: "15/09/2024", due: "15/10/2024", amount: 5400, status: "En retard", items: "Maintenance T3" },
    { id: "F-2024-1101", date: "20/10/2024", due: "20/11/2024", amount: 8200, status: "Non payée", items: "Matériel Réseau" },
  ],
  tickets: [
    { 
      id: "T-992", subject: "Panne Disque Dur Serveur", date: "10/10/2024", status: "En cours", priority: "Haute", 
      messages: [
        { author: "Client", text: "Le voyant HDD 2 clignote orange sur le serveur principal.", date: "10/10 09:00" },
        { author: "Support X-Zone", text: "Bien reçu. C'est une panne prédictive. Un technicien va passer avec un disque de rechange demain matin.", date: "10/10 10:15" }
      ]
    },
    { 
      id: "T-850", subject: "Accès VPN Lent", date: "01/09/2024", status: "Fermé", priority: "Moyenne", 
      messages: [{ author: "Client", text: "Lenteurs constatées.", date: "01/09" }] 
    }
  ],
  documents: [
    { id: 1, name: "Contrat de Maintenance 2024.pdf", size: "2.4 MB", date: "01/01/2024", type: "contract" },
    { id: 2, name: "Rapport Audit Sécurité.pdf", size: "5.1 MB", date: "15/06/2024", type: "report" },
    { id: 3, name: "Catalogue X-Zone Q4.pdf", size: "8.2 MB", date: "01/10/2024", type: "catalog" },
  ]
};

// --- REUSABLE COMPONENTS ---

const StatusBadge = ({ status }: { status: string }) => {
  let styles = "bg-gray-100 text-gray-800";
  if (["Validé", "Payée", "Livrée", "Fermé", "Résolu"].includes(status)) styles = "bg-green-100 text-green-700 border border-green-200";
  if (["En attente", "En préparation", "En cours", "Non payée"].includes(status)) styles = "bg-blue-50 text-blue-700 border border-blue-100";
  if (["Refusé", "En retard", "Annulée", "Haute", "Critique"].includes(status)) styles = "bg-red-50 text-red-700 border border-red-100";
  if (["Ouvert", "Moyenne"].includes(status)) styles = "bg-orange-50 text-orange-700 border border-orange-100";

  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>;
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = "", ...props }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

const EmptyState = ({ title, desc, action }: { title: string, desc: string, action?: React.ReactNode }) => (
  <div className="text-center py-16">
    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
      <Search className="w-8 h-8 text-gray-300" />
    </div>
    <h3 className="text-gray-900 font-bold mb-1">{title}</h3>
    <p className="text-gray-500 text-sm mb-6">{desc}</p>
    {action}
  </div>
);

// --- SECTIONS ---

// 1. DASHBOARD
const DashboardSection = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_DATA.stats.map((stat, idx) => (
          <Card key={idx} className="p-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800">Activité Récente</h3>
              <Button variant="white" size="sm" onClick={() => onNavigate('orders')}>Voir tout</Button>
            </div>
            <div className="space-y-4">
              {MOCK_DATA.orders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-full text-corporate-blue">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{order.title}</p>
                      <p className="text-xs text-gray-500">Commande {order.id} • {order.date}</p>
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
              {MOCK_DATA.tickets.slice(0, 1).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-50 rounded-full text-purple-600">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">Ticket {ticket.id} • {ticket.date}</p>
                    </div>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Alerts / Actions */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-corporate-blue to-blue-900 text-white border-none">
            <h3 className="font-bold text-lg mb-2">Besoin d'aide ?</h3>
            <p className="text-blue-100 text-sm mb-6">Nos experts sont disponibles pour une intervention rapide ou un conseil.</p>
            <Button variant="primary" className="w-full bg-white text-corporate-blue hover:bg-gray-100 border-none" onClick={() => onNavigate('support')}>
              Ouvrir un ticket
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-4">Factures à payer</h3>
            {MOCK_DATA.invoices.filter(i => i.status === 'En retard' || i.status === 'Non payée').length > 0 ? (
              <div className="space-y-3">
                {MOCK_DATA.invoices.filter(i => i.status === 'En retard').map(inv => (
                  <div key={inv.id} className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-100">
                    <div>
                      <p className="text-xs font-bold text-red-800">{inv.id}</p>
                      <p className="text-xs text-red-600">Échéance : {inv.due}</p>
                    </div>
                    <span className="font-bold text-sm text-red-800">{inv.amount} MAD</span>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => onNavigate('invoices')}>Régulariser</Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Vous êtes à jour !</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// 2. QUOTES
const QuotesSection = () => {
  const [view, setView] = useState<ViewState>('list');
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  const handleDownload = (quote: any) => {
    generatePDF({
        type: 'DEVIS',
        reference: quote.id,
        date: quote.date,
        validityDate: quote.validUntil,
        client: { name: quote.client, address: "Casablanca" },
        items: quote.items.map((i: any) => ({ description: i.desc, quantity: i.qty, unitPrice: i.price }))
    });
  };

  if (view === 'detail' && selectedQuote) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => setView('list')} className="flex items-center text-sm text-gray-500 hover:text-corporate-blue">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux devis
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{selectedQuote.title}</h2>
              <StatusBadge status={selectedQuote.status} />
            </div>
            <p className="text-gray-500 text-sm mt-1">Devis #{selectedQuote.id} du {selectedQuote.date}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleDownload(selectedQuote)}>
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
            {selectedQuote.status === 'En attente' && (
              <>
                <Button variant="primary" className="bg-green-600 hover:bg-green-700 border-green-600">Accepter</Button>
                <Button variant="white" className="text-red-600 border-red-200 hover:bg-red-50">Refuser</Button>
              </>
            )}
          </div>
        </div>

        <Card className="p-8">
          <div className="border-b border-gray-100 pb-6 mb-6 flex justify-between">
            <div>
              <p className="text-xs uppercase text-gray-400 font-bold mb-1">Émetteur</p>
              <p className="font-bold text-corporate-blue">X-Zone Technologie</p>
              <p className="text-sm text-gray-500">Bd Taza, Casablanca</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-gray-400 font-bold mb-1">Client</p>
              <p className="font-bold text-gray-900">{selectedQuote.client}</p>
              <p className="text-sm text-gray-500">Siège Social</p>
            </div>
          </div>

          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Description</th>
                <th className="px-4 py-3 text-center">Qté</th>
                <th className="px-4 py-3 text-right">Prix Unitaire</th>
                <th className="px-4 py-3 text-right rounded-r-lg">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedQuote.items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-4 py-4 font-medium text-gray-900">{item.desc}</td>
                  <td className="px-4 py-4 text-center">{item.qty}</td>
                  <td className="px-4 py-4 text-right">{item.price.toLocaleString()} MAD</td>
                  <td className="px-4 py-4 text-right font-bold">{(item.price * item.qty).toLocaleString()} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Total HT</span>
                <span>{selectedQuote.amount.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA (20%)</span>
                <span>{(selectedQuote.amount * 0.2).toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-corporate-blue border-t border-gray-200 pt-3">
                <span>Total TTC</span>
                <span>{(selectedQuote.amount * 1.2).toLocaleString()} MAD</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-corporate-blue">Mes Devis</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Rechercher..." className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-corporate-blue outline-none" />
          </div>
          <Button variant="white"><Filter className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Référence</th>
              <th className="px-6 py-4">Titre</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Montant HT</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_DATA.quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => { setSelectedQuote(quote); setView('detail'); }}>
                <td className="px-6 py-4 font-bold text-corporate-blue">{quote.id}</td>
                <td className="px-6 py-4 text-gray-900">{quote.title}</td>
                <td className="px-6 py-4 text-gray-500">{quote.date}</td>
                <td className="px-6 py-4 font-medium">{quote.amount.toLocaleString()} MAD</td>
                <td className="px-6 py-4"><StatusBadge status={quote.status} /></td>
                <td className="px-6 py-4 text-right">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="white" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={(e) => { e.stopPropagation(); handleDownload(quote); }}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// 3. ORDERS
const OrdersSection = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in h-[calc(100vh-140px)]">
      {/* List */}
      <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        <h2 className="text-xl font-bold text-corporate-blue mb-4">Commandes</h2>
        {MOCK_DATA.orders.map((order) => (
          <div 
            key={order.id} 
            onClick={() => setSelectedOrder(order)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedOrder?.id === order.id 
                ? 'bg-blue-50 border-corporate-blue shadow-sm' 
                : 'bg-white border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-sm text-gray-900">{order.id}</span>
              <span className="text-xs text-gray-500">{order.date}</span>
            </div>
            <h3 className="font-bold text-corporate-blue mb-1">{order.title}</h3>
            <div className="flex justify-between items-center mt-3">
              <StatusBadge status={order.status} />
              <span className="font-bold text-sm">{order.amount.toLocaleString()} MAD</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail / Tracking */}
      <div className="lg:col-span-2">
        {selectedOrder ? (
          <Card className="h-full p-8 flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedOrder.title}</h2>
                <p className="text-gray-500">Ref: {selectedOrder.id}</p>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" /> Bon de Commande
              </Button>
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-corporate-blue" /> Suivi de commande
              </h3>
              <div className="relative pl-4 border-l-2 border-gray-100 space-y-8 ml-2">
                {selectedOrder.steps.map((step: any, idx: number) => (
                  <div key={idx} className="relative pl-6">
                    <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 ${
                      step.done ? 'bg-green-500 border-green-500' : 
                      step.current ? 'bg-blue-500 border-blue-500 animate-pulse' : 'bg-white border-gray-300'
                    }`}>
                      {step.done && <Check className="w-3 h-3 text-white absolute top-0 left-0" />}
                    </div>
                    <p className={`text-sm font-bold ${step.done || step.current ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500">{step.date}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Besoin d'accélérer cette commande ? Contactez votre chargé de compte au <strong>05 22 52 32 32</strong>.
              </p>
            </div>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
            <p>Sélectionnez une commande pour voir les détails</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. INVOICES
const InvoicesSection = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-corporate-blue">Facturation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 border-l-4 border-red-500">
          <p className="text-gray-500 text-xs uppercase font-bold">Impayé</p>
          <p className="text-2xl font-bold text-red-600">8 200 MAD</p>
        </Card>
        <Card className="p-4 border-l-4 border-orange-400">
          <p className="text-gray-500 text-xs uppercase font-bold">À venir (30j)</p>
          <p className="text-2xl font-bold text-gray-900">12 500 MAD</p>
        </Card>
        <Card className="p-4 border-l-4 border-green-500">
          <p className="text-gray-500 text-xs uppercase font-bold">Payé (2024)</p>
          <p className="text-2xl font-bold text-green-600">145 000 MAD</p>
        </Card>
      </div>

      <Card>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">Numéro</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Libellé</th>
              <th className="px-6 py-4">Échéance</th>
              <th className="px-6 py-4">Montant TTC</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_DATA.invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-gray-900">{inv.id}</td>
                <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                <td className="px-6 py-4">{inv.items}</td>
                <td className="px-6 py-4 text-gray-500">{inv.due}</td>
                <td className="px-6 py-4 font-bold">{inv.amount.toLocaleString()} MAD</td>
                <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                <td className="px-6 py-4 text-right">
                  {inv.status !== 'Payée' ? (
                    <Button size="sm" className="bg-corporate-blue hover:bg-blue-900">Payer</Button>
                  ) : (
                    <Button variant="white" size="sm"><Download className="w-4 h-4" /></Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// 5. SUPPORT
const SupportSection = () => {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if(!newMessage.trim()) return;
    const msg = { author: "Client", text: newMessage, date: "À l'instant" };
    const updatedTicket = { ...selectedTicket, messages: [...selectedTicket.messages, msg] };
    setSelectedTicket(updatedTicket);
    setNewMessage("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in h-[calc(100vh-140px)]">
      {/* Ticket List */}
      <div className="lg:col-span-1 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-corporate-blue">Tickets</h2>
          <Button size="sm" className="h-8 w-8 p-0 rounded-full bg-corporate-red hover:bg-red-700 text-white flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {MOCK_DATA.tickets.map(ticket => (
            <div 
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                selectedTicket?.id === ticket.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-bold text-xs text-gray-500">{ticket.id}</span>
                <span className="text-xs text-gray-400">{ticket.date}</span>
              </div>
              <h4 className="font-bold text-sm text-gray-900 mb-2 truncate">{ticket.subject}</h4>
              <div className="flex gap-2">
                <StatusBadge status={ticket.status} />
                <span className="text-xs border px-2 py-0.5 rounded text-gray-500">{ticket.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">{selectedTicket.subject}</h3>
                <p className="text-xs text-gray-500">Ticket #{selectedTicket.id}</p>
              </div>
              <StatusBadge status={selectedTicket.status} />
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {selectedTicket.messages.map((msg: any, idx: number) => (
                <div key={idx} className={`flex ${msg.author === 'Client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.author === 'Client' 
                      ? 'bg-corporate-blue text-white rounded-br-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}>
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${msg.author === 'Client' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.author} • {msg.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-corporate-blue outline-none"
                  placeholder="Écrivez votre réponse..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <HelpCircle className="w-16 h-16 mb-4 opacity-20" />
            <p>Sélectionnez un ticket ou créez-en un nouveau</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 6. DOCUMENTS
const DocumentsSection = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-corporate-blue">Documents</h2>
      <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filtrer</Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {MOCK_DATA.documents.map((doc) => (
        <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Download className="w-5 h-5 text-gray-500 hover:text-corporate-blue" />
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-500 mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 truncate mb-1">{doc.name}</h3>
          <p className="text-xs text-gray-500">{doc.date} • {doc.size}</p>
        </Card>
      ))}
      <div className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 text-gray-400 hover:border-corporate-blue hover:text-corporate-blue transition-colors cursor-pointer">
        <Plus className="w-8 h-8 mb-2" />
        <span className="text-sm font-medium">Déposer un fichier</span>
      </div>
    </div>
  </div>
);

// 7. SETTINGS
const SettingsSection = () => (
  <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-8">
    <h2 className="text-2xl font-bold text-corporate-blue">Paramètres du compte</h2>
    
    <Card className="p-6">
      <h3 className="font-bold text-gray-900 mb-6 flex items-center"><User className="w-5 h-5 mr-2" /> Profil Société</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Raison Sociale</label>
          <input type="text" value="TechSolutions SARL" disabled className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-600" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ICE / RC</label>
          <input type="text" value="0015283992000" disabled className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-600" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adresse de facturation</label>
          <input type="text" defaultValue="123 Bd Zerktouni, Casablanca" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-corporate-blue outline-none" />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button size="sm">Enregistrer</Button>
      </div>
    </Card>

    <Card className="p-6">
      <h3 className="font-bold text-gray-900 mb-6 flex items-center"><Lock className="w-5 h-5 mr-2" /> Sécurité</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="font-medium text-sm">Mot de passe</p>
            <p className="text-xs text-gray-500">Dernière modification il y a 3 mois</p>
          </div>
          <Button variant="outline" size="sm">Modifier</Button>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <div>
            <p className="font-medium text-sm">Double authentification (2FA)</p>
            <p className="text-xs text-gray-500">Non activé</p>
          </div>
          <Button variant="white" size="sm" className="text-corporate-blue">Activer</Button>
        </div>
      </div>
    </Card>
  </div>
);

// --- MAIN CLIENT AREA LAYOUT ---

export const ClientArea: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: t('clientArea.sidebar.dashboard'), icon: Home },
    { id: 'quotes', label: t('clientArea.sidebar.quotes'), icon: FileText },
    { id: 'orders', label: t('clientArea.sidebar.orders'), icon: Package },
    { id: 'invoices', label: t('clientArea.sidebar.invoices'), icon: DollarSign },
    { id: 'support', label: t('clientArea.sidebar.support'), icon: HelpCircle },
    { id: 'documents', label: t('clientArea.sidebar.documents'), icon: Paperclip },
    { id: 'settings', label: t('clientArea.sidebar.settings'), icon: Settings },
  ];

  // LOGIN VIEW
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <SEO 
          title="Connexion Espace Client" 
          description="Connectez-vous à votre espace client X-Zone pour suivre vos commandes, factures et tickets support."
          noIndex
        />
        <Link to="/" className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-corporate-blue transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour au site
        </Link>
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-corporate-blue">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Espace Client Pro</h1>
            <p className="text-gray-500 text-sm">Accédez à votre tableau de bord sécurisé</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">Mode Démo : Cliquez simplement sur "Se connecter" pour accéder à l'interface de démonstration.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" defaultValue="demo@client.ma" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-corporate-blue outline-none bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" defaultValue="password" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-corporate-blue outline-none bg-gray-50" />
            </div>
            <Button className="w-full py-3">Se connecter</Button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD LAYOUT
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <SEO 
        title={`Espace Client - ${activeView.charAt(0).toUpperCase() + activeView.slice(1)}`} 
        description="Gérez votre activité, vos devis et vos commandes sur votre espace client X-Zone Technologie."
        noIndex
      />

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-corporate-blue text-white transition-transform duration-300 transform 
        md:translate-x-0 md:static flex flex-col shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-blue-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center font-bold text-corporate-blue text-lg">X</div>
          <div>
            <h2 className="font-bold text-sm leading-none">Espace Client</h2>
            <p className="text-[10px] text-blue-300 mt-1">TechSolutions SARL</p>
          </div>
          <button className="md:hidden ml-auto" onClick={() => setIsSidebarOpen(false)}><XIcon className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                activeView === item.id 
                  ? 'bg-corporate-red text-white shadow-lg' 
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${activeView === item.id ? 'text-white' : 'text-blue-300'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button onClick={handleLogout} className="w-full flex items-center px-3 py-2 text-sm text-red-300 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 mr-3" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-30">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-600" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 capitalize hidden sm:block">{activeView === 'dashboard' ? 'Tableau de bord' : t(`clientArea.sidebar.${activeView}`)}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-400 hover:text-corporate-blue cursor-pointer transition-colors" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </div>
            <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">Ahmed Benali</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold border-2 border-white shadow-sm">AB</div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && <DashboardSection onNavigate={setActiveView} />}
            {activeView === 'quotes' && <QuotesSection />}
            {activeView === 'orders' && <OrdersSection />}
            {activeView === 'invoices' && <InvoicesSection />}
            {activeView === 'support' && <SupportSection />}
            {activeView === 'documents' && <DocumentsSection />}
            {activeView === 'settings' && <SettingsSection />}
          </div>
        </div>
      </main>
      
      {/* Global Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
      `}</style>
    </div>
  );
};
