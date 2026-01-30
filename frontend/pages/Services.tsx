
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, ArrowRight, Server, Calendar, Wifi, PenTool, Shield, ChevronRight } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/Button';
import { SERVICES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const icons: any = {
  Monitor: Server,
  Calendar: Calendar,
  Wifi: Wifi,
  Tool: PenTool,
  Shield: Shield
};

export const Services: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();

  // If a slug is present, show the specific service detail
  if (slug) {
    const service = SERVICES.find(s => s.slug === slug);
    
    if (!service) {
      return <div className="py-20 text-center">{t('common.error')} <Link to="/services" className="text-blue-600 underline">Retour</Link></div>;
    }

    const Icon = icons[service.icon] || Server;

    // Retrieve translated data
    const title = t(`services_data.${service.slug}.title`);
    const shortDesc = t(`services_data.${service.slug}.shortDescription`);
    const fullDesc = t(`services_data.${service.slug}.fullDescription`);
    
    // Safety check for arrays
    const benefitsRaw = t(`services_data.${service.slug}.benefits`);
    const benefits = Array.isArray(benefitsRaw) ? benefitsRaw : [];
    
    const featuresRaw = t(`services_data.${service.slug}.features`);
    const features = Array.isArray(featuresRaw) ? featuresRaw : [];

    return (
      <div className="bg-white">
        <SEO 
          title={title} 
          description={shortDesc} 
        />
        
        {/* Service Hero */}
        <div className="bg-corporate-blue text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <div className="flex items-center text-sm text-gray-300 mb-4">
                  <Link to="/" className="hover:text-white">{t('nav.home')}</Link>
                  <ChevronRight className="w-4 h-4 mx-2" />
                  <Link to="/services" className="hover:text-white">{t('nav.services')}</Link>
                  <ChevronRight className="w-4 h-4 mx-2" />
                  <span className="text-corporate-red font-semibold">{title}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6">{title}</h1>
                <p className="text-xl text-gray-200">{shortDesc}</p>
              </div>
              <div className="md:w-1/3 flex justify-center">
                 <div className="bg-white/10 p-8 rounded-full">
                    <Icon className="w-24 h-24 text-corporate-red" />
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-corporate-blue mb-6">{t('servicesPage.description')}</h2>
              <p className="text-gray-600 leading-relaxed mb-10 text-lg">
                {fullDesc}
              </p>

              <h2 className="text-2xl font-bold text-corporate-blue mb-6">{t('servicesPage.whyUs')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {benefits.map((benefit: string, idx: number) => (
                  <div key={idx} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="ml-4 text-gray-700 font-medium">{benefit}</p>
                  </div>
                ))}
              </div>

              <h2 className="text-2xl font-bold text-corporate-blue mb-6">{t('servicesPage.features')}</h2>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-corporate-red rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm sticky top-24">
                <h3 className="text-xl font-bold text-corporate-blue mb-4">{t('servicesPage.sidebar.needHelp')}</h3>
                <p className="text-gray-600 text-sm mb-6">
                  {t('servicesPage.sidebar.desc')}
                </p>
                <Link to="/contact">
                  <Button className="w-full">{t('common.askQuote')}</Button>
                </Link>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{t('servicesPage.sidebar.other')}</p>
                  <ul className="space-y-2">
                    {SERVICES.filter(s => s.slug !== slug).map(s => (
                      <li key={s.id}>
                        <Link to={`/services/${s.slug}`} className="text-gray-600 hover:text-corporate-red text-sm block py-1">
                          • {t(`services_data.${s.slug}.title`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no slug, show list of services
  return (
    <div className="bg-white">
      <SEO 
        title={t('meta.servicesTitle')} 
        description={t('meta.servicesDesc')} 
      />
      
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-corporate-blue mb-4 font-heading">{t('services.header.title')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('services.header.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service) => {
             const Icon = icons[service.icon] || Server;
             const title = t(`services_data.${service.slug}.title`);
             const fullDesc = t(`services_data.${service.slug}.fullDescription`);
             
             const featuresRaw = t(`services_data.${service.slug}.features`);
             const features = Array.isArray(featuresRaw) ? featuresRaw : [];

             return (
              <div key={service.id} className="flex flex-col bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="p-8 flex-1">
                  <div className="w-12 h-12 bg-corporate-blue/10 rounded-lg flex items-center justify-center mb-6 text-corporate-blue">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                  <p className="text-gray-600 mb-6 line-clamp-3">{fullDesc}</p>
                  <div className="space-y-2 mb-6">
                    {features.slice(0, 3).map((feat: string, i: number) => (
                      <div key={i} className="flex items-center text-sm text-gray-500">
                        <Check className="w-3 h-3 mr-2 text-green-500" /> {feat}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 border-t border-gray-100">
                  <Link to={`/services/${service.slug}`} className="text-corporate-red font-semibold text-sm flex items-center justify-center hover:text-red-800">
                    {t('services.btnDetail')} <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
