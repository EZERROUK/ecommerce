import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { BackToTop } from './components/BackToTop';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { CartProvider } from './contexts/CartContext';
import { prefetchCriticalRoutesOnIdle } from './utils/routePrefetch';

const lazyNamed = <T extends Record<string, unknown>, K extends keyof T>(
  importer: () => Promise<T>,
  exportName: K,
) =>
  React.lazy(async () => {
    const mod = await importer();
    const component = mod[exportName] as unknown as React.ComponentType;
    return { default: component };
  });

const Home = lazyNamed(() => import('./pages/Home'), 'Home');
const About = lazyNamed(() => import('./pages/About'), 'About');
const Services = lazyNamed(() => import('./pages/Services'), 'Services');
const Shop = lazyNamed(() => import('./pages/Shop'), 'Shop');
const Contact = lazyNamed(() => import('./pages/Contact'), 'Contact');
const ProductDetail = lazyNamed(() => import('./pages/ProductDetail'), 'ProductDetail');
const Configurator = lazyNamed(() => import('./pages/Configurator'), 'Configurator');
const ClientArea = lazyNamed(() => import('./pages/ClientArea'), 'ClientArea');
const Blog = lazyNamed(() => import('./pages/Blog'), 'Blog');
const KnowledgeCenter = lazyNamed(() => import('./pages/KnowledgeCenter'), 'KnowledgeCenter');
const FAQ = lazyNamed(() => import('./pages/FAQ'), 'FAQ');
const SuccessStories = lazyNamed(() => import('./pages/SuccessStories'), 'SuccessStories');
const Compare = lazyNamed(() => import('./pages/Compare'), 'Compare');
const Diagnostic = lazyNamed(() => import('./pages/Diagnostic'), 'Diagnostic');
const SectorDetail = lazyNamed(() => import('./pages/SectorDetail'), 'SectorDetail');
const Buyback = lazyNamed(() => import('./pages/Buyback'), 'Buyback');
const AdvancedSearch = lazyNamed(() => import('./pages/AdvancedSearch'), 'AdvancedSearch');
const ArticleDetail = lazyNamed(() => import('./pages/ArticleDetail'), 'ArticleDetail');
const Cart = lazyNamed(() => import('./pages/Cart'), 'Cart');
const Checkout = lazyNamed(() => import('./pages/Checkout'), 'Checkout');
const OrderSuccess = lazyNamed(() => import('./pages/OrderSuccess'), 'OrderSuccess');
const OrderTracking = lazyNamed(() => import('./pages/OrderTracking'), 'OrderTracking');
const Chatbot = lazyNamed(() => import('./components/Chatbot'), 'Chatbot');

const RouteFallback = () => (
  <div className="flex items-center justify-center p-6 text-sm text-gray-500">Chargement…</div>
);

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith('/client-area')) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
};

// Layout Manager Component
const AppLayout = () => {
  const location = useLocation();
  // Using context instead of local state
  const { isOpen, setDiagnosticContext } = useChat(); 

  // Check if the current route is part of the Client Area
  const isClientArea = location.pathname.startsWith('/client-area');

  // STRICT CONTEXT MANAGEMENT: Reset diagnostic context when leaving diagnostic pages
  useEffect(() => {
    if (!location.pathname.startsWith('/diagnostic')) {
      setDiagnosticContext(null);
    }
  }, [location.pathname, setDiagnosticContext]);

  useEffect(() => {
    if (isClientArea) return;
    return prefetchCriticalRoutesOnIdle();
  }, [isClientArea]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-corporate-text relative bg-white">
      {!isClientArea && <Header />}

      <main className={isClientArea ? 'h-screen w-full overflow-hidden' : 'flex-grow'} role="main">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<Services />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/produits" element={<Shop />} />
            <Route path="/produits/:id" element={<ProductDetail />} />
            <Route path="/product/:id" element={<ProductDetail />} />

            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
            <Route path="/order-tracking" element={<OrderTracking />} />

            <Route path="/configurator" element={<Configurator />} />
            <Route path="/compare" element={<Compare />} />

            <Route path="/client-area/*" element={<ClientArea />} />

            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<ArticleDetail />} />

            <Route path="/knowledge" element={<KnowledgeCenter />} />
            <Route path="/knowledge/:slug" element={<ArticleDetail />} />

            <Route path="/faq" element={<FAQ />} />

            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/solutions/:sectorId" element={<SectorDetail />} />
            <Route path="/rachat" element={<Buyback />} />
            <Route path="/search" element={<AdvancedSearch />} />

            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Suspense>
      </main>

      {!isClientArea && <Footer />}

      {!isClientArea && <BackToTop />}
      {!isClientArea && <WhatsAppButton isHidden={isOpen} />}
      {/* Chatbot now manages its own open/close via context, but we render it here */}
      {!isClientArea && (
        <Suspense fallback={null}>
          <Chatbot />
        </Suspense>
      )}
    </div>
  );
};

function App() {
  return (
    <ChatProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <AppLayout />
        </Router>
      </CartProvider>
    </ChatProvider>
  );
}

export default App;
