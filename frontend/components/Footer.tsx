
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Linkedin, Facebook, Instagram, ChevronRight } from 'lucide-react';
import { COMPANY_INFO, NAV_ITEMS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-corporate-blue text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
             <div className="flex flex-col mb-4">
                <span className="text-2xl font-bold font-heading text-white tracking-tighter">
                  X-ZONE
                </span>
                <span className="text-[10px] text-corporate-red tracking-[0.2em] font-semibold uppercase">
                  Technologie
                </span>
              </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {t('footer.desc')}
            </p>
            <div className="flex space-x-4 pt-2">
              <a href={COMPANY_INFO.social.linkedin} className="text-gray-400 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
              <a href={COMPANY_INFO.social.facebook} className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href={COMPANY_INFO.social.instagram} className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 font-heading">{t('footer.links')}</h3>
            <ul className="space-y-3">
              {NAV_ITEMS.map((item) => {
                 // Reuse navigation keys from translations for links
                 let labelKey = item.label;
                 if (item.label === 'Accueil') labelKey = 'home';
                 else if (item.label === 'Entreprise') labelKey = 'company';
                 else if (item.label === 'Services') labelKey = 'services';
                 else if (item.label === 'Catalogue') labelKey = 'catalog';
                 else if (item.label === 'Ressources') labelKey = 'resources';
                 else if (item.label === 'Solutions') labelKey = 'solutions';
                 else if (item.label === 'Contact') labelKey = 'contact';

                 return (
                  <li key={item.path}>
                    <Link to={item.path} className="text-gray-300 hover:text-corporate-red text-sm flex items-center transition-colors">
                      <ChevronRight size={14} className="mr-2 rtl:rotate-180" />
                      {t(`nav.${labelKey}`) !== `nav.${labelKey}` ? t(`nav.${labelKey}`) : item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-6 font-heading">{t('footer.services')}</h3>
            <ul className="space-y-3">
              <li><Link to="/services/vente-integration" className="text-gray-300 hover:text-corporate-red text-sm flex items-center transition-colors"><ChevronRight size={14} className="mr-2 rtl:rotate-180" /> {t('nav.servicesSub.sales')}</Link></li>
              <li><Link to="/services/location" className="text-gray-300 hover:text-corporate-red text-sm flex items-center transition-colors"><ChevronRight size={14} className="mr-2 rtl:rotate-180" /> {t('nav.servicesSub.rental')}</Link></li>
              <li><Link to="/services/reseau-infrastructure" className="text-gray-300 hover:text-corporate-red text-sm flex items-center transition-colors"><ChevronRight size={14} className="mr-2 rtl:rotate-180" /> {t('nav.servicesSub.network')}</Link></li>
              <li><Link to="/services/maintenance" className="text-gray-300 hover:text-corporate-red text-sm flex items-center transition-colors"><ChevronRight size={14} className="mr-2 rtl:rotate-180" /> {t('nav.servicesSub.maintenance')}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-6 font-heading">{t('footer.contact')}</h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-corporate-red flex-shrink-0 mt-0.5 rtl:mr-0 rtl:ml-3" />
                <span>{t('footer.address')}</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-corporate-red flex-shrink-0 rtl:mr-0 rtl:ml-3" />
                <a href={`tel:${COMPANY_INFO.phone}`} className="hover:text-white" dir="ltr">{COMPANY_INFO.phone}</a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-corporate-red flex-shrink-0 rtl:mr-0 rtl:ml-3" />
                <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-white">{COMPANY_INFO.email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {COMPANY_INFO.name}. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};
