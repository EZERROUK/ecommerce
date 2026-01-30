
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Phone, Mail, User, Settings, FileText, Search, ShoppingCart } from 'lucide-react';
import { NAV_ITEMS, COMPANY_INFO } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { prefetchRoute } from '../utils/routePrefetch';
import { LazyImage } from './LazyImage';

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { itemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <>
      {/* Top Bar */}
      <div className="bg-corporate-blue text-white text-xs py-2 hidden md:block transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex space-x-6">
            <a href={`tel:${COMPANY_INFO.phone}`} className="flex items-center hover:text-gray-300">
              <Phone className="w-3 h-3 mr-2" /> {COMPANY_INFO.phone}
            </a>
            <a href={`mailto:${COMPANY_INFO.email}`} className="flex items-center hover:text-gray-300">
              <Mail className="w-3 h-3 mr-2" /> {COMPANY_INFO.email}
            </a>
          </div>
          <div className="flex space-x-4 items-center">
            {/* Links */}
            <Link to="/success-stories" className="hover:text-corporate-red transition-colors flex items-center">
               <FileText className="w-3 h-3 mr-1" /> Success Stories
            </Link>
             <span className="text-gray-500">|</span>
             <Link to="/order-tracking" className="hover:text-corporate-red transition-colors flex items-center">
               <FileText className="w-3 h-3 mr-1" /> Suivi commande
             </Link>
             <span className="text-gray-500">|</span>
             <Link to="/configurator" className="hover:text-corporate-red transition-colors flex items-center font-semibold text-green-400">
               <Settings className="w-3 h-3 mr-1" /> Configurateur
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 w-full ${
          scrolled ? 'bg-white shadow-md py-2' : 'bg-white py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo SVG Integration */}
          <Link
            to="/"
           className="flex items-center ml-2 mr-8 flex-shrink-0"
            aria-label="X-Zone Accueil"
          >
            <LazyImage
              src="/images/logo.png"
              alt="X-Zone Technologie"
              className="h-10 w-auto object-contain"
              width={160}
              height={40}
              loading="eager"
              fetchPriority="high"
            />
          </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-6 xl:space-x-8">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path || 
                                 (item.path !== '/' && location.pathname.startsWith(item.path + '/')) ||
                                 (item.subItems && item.subItems.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path)));
                
                const translatedLabel = item.label === 'Accueil' ? t('nav.home') :
                                      item.label === 'Entreprise' ? t('nav.company') :
                                      item.label === 'Services' ? t('nav.services') :
                                      item.label === 'Catalogue' ? t('nav.catalog') :
                                      item.label === 'Ressources' ? t('nav.resources') :
                                      item.label === 'Solutions' ? t('nav.solutions') :
                                      item.label === 'Contact' ? t('nav.contact') : item.label;

                return (
                  <div key={item.path} className="relative group">
                    <Link
                      to={item.path}
                      className={`text-sm font-medium transition-colors hover:text-corporate-red flex items-center ${
                        isActive ? 'text-corporate-red' : 'text-corporate-blue'
                      }`}
                      onClick={(e) => { if(item.subItems) e.preventDefault(); }} 
                      onMouseEnter={() => prefetchRoute(item.path)}
                      onFocus={() => prefetchRoute(item.path)}
                    >
                      {translatedLabel}
                      {item.subItems && <ChevronDown className="ml-1 w-4 h-4" />}
                    </Link>
                    
                    {/* Dropdown */}
                    {item.subItems && (
                      <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform z-50 text-left">
                        <div className="py-1">
                          {item.subItems.map((sub) => (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-corporate-red"
                              onMouseEnter={() => prefetchRoute(sub.path)}
                              onFocus={() => prefetchRoute(sub.path)}
                            >
                              {sub.key ? t(sub.key) : sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* CTA & Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <Link to="/search" className="text-corporate-blue hover:text-corporate-red p-2 transition-colors" title={t('nav.search')}>
                  <Search className="w-5 h-5" />
              </Link>
              <Link to="/cart" className="relative text-corporate-blue hover:text-corporate-red p-2 transition-colors" title="Panier">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-corporate-red text-white text-[10px] flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
              <Link to="/client-area">
                <button className="flex items-center justify-center px-4 py-2 text-sm font-medium text-corporate-blue bg-gray-100 rounded hover:bg-gray-200 transition-colors whitespace-nowrap flex-shrink-0 h-10">
                  <User className="w-4 h-4 mr-2" />
                  {t('nav.clientArea')}
                </button>
              </Link>
              <Link to="/contact">
                <button className="flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-corporate-red rounded hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap flex-shrink-0 h-10">
                  {t('nav.quote')}
                </button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-corporate-blue hover:text-corporate-red focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg h-screen overflow-y-auto pb-20 z-50">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              
              {NAV_ITEMS.map((item) => {
                 const translatedLabel = item.label === 'Accueil' ? t('nav.home') :
                 item.label === 'Entreprise' ? t('nav.company') :
                 item.label === 'Services' ? t('nav.services') :
                 item.label === 'Catalogue' ? t('nav.catalog') :
                 item.label === 'Ressources' ? t('nav.resources') :
                 item.label === 'Solutions' ? t('nav.solutions') :
                 item.label === 'Contact' ? t('nav.contact') : item.label;

                 return (
                <div key={item.path}>
                  <Link
                    to={item.subItems ? '#' : item.path}
                    onClick={() => !item.subItems && setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-corporate-red hover:bg-gray-50"
                  >
                    {translatedLabel}
                  </Link>
                  {item.subItems && (
                    <div className="pl-4 space-y-1 border-l-2 border-gray-100 ml-3">
                      {item.subItems.map(sub => (
                         <Link
                         key={sub.path}
                         to={sub.path}
                         onClick={() => setIsOpen(false)}
                         className="block px-3 py-2 rounded-md text-sm text-gray-500 hover:text-corporate-red"
                       >
                         {sub.key ? t(sub.key) : sub.label}
                       </Link>
                      ))}
                    </div>
                  )}
                </div>
              )})}
              
              <div className="border-t border-gray-100 my-2 pt-2">
                 <Link to="/search" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-corporate-blue hover:bg-gray-50 flex items-center">
                    <Search className="w-4 h-4 mr-2" /> {t('nav.search')}
                 </Link>
                 <Link to="/cart" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-corporate-blue hover:bg-gray-50 flex items-center">
                   <ShoppingCart className="w-4 h-4 mr-2" /> Panier{itemCount > 0 ? ` (${itemCount})` : ''}
                 </Link>
                 <Link to="/order-tracking" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-corporate-blue hover:bg-gray-50 flex items-center">
                   <FileText className="w-4 h-4 mr-2" /> Suivi commande
                 </Link>
                 <Link to="/configurator" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-corporate-blue hover:bg-gray-50 flex items-center">
                   <Settings className="w-4 h-4 mr-2" /> Configurateur PC
                 </Link>
                 <Link to="/client-area" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-corporate-blue hover:bg-gray-50 flex items-center">
                   <User className="w-4 h-4 mr-2" /> {t('nav.clientArea')}
                 </Link>
              </div>

              <div className="mt-4 px-3">
                 <Link to="/contact" onClick={() => setIsOpen(false)} className="block w-full text-center px-5 py-3 text-base font-medium text-white bg-corporate-red rounded hover:bg-red-700 shadow">
                  {t('nav.quote')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
