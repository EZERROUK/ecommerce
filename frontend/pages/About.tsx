
import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Award, Briefcase } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

export const About: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-white">
      <SEO 
        title={t('meta.aboutTitle')} 
        description={t('meta.aboutDesc')} 
      />

      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-corporate-blue mb-4 font-heading">{t('about.header.title')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('about.header.subtitle')}
          </p>
        </div>
      </div>

      {/* Presentation Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-block px-3 py-1 bg-blue-100 text-corporate-blue text-sm font-semibold rounded-full mb-4">
                Historique
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-heading">
                {t('about.presentation.title')}
              </h2>
              <div className="space-y-6 text-gray-600 leading-relaxed text-justify">
                <p>
                  {t('about.presentation.p1')}
                </p>
                <p>
                  {t('about.presentation.p2')}
                </p>
              </div>
            </div>
            <div className="relative mt-8 md:mt-0">
              <div className="absolute inset-0 bg-corporate-blue transform translate-x-4 translate-y-4 rounded-lg"></div>
              <img 
                src="/images/Office.png" 
                alt="Bureaux X-Zone Technologie" 
                className="relative rounded-lg shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-corporate-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
             {/* Text Content */}
             <div className="md:order-2">
                <div className="inline-block px-3 py-1 bg-corporate-red text-white text-sm font-semibold rounded-full mb-4">
                    Notre Force
                </div>
                <h2 className="text-3xl font-bold mb-6 font-heading">
                    {t('about.team.title')}
                </h2>
                <div className="space-y-6 text-blue-100 leading-relaxed text-justify">
                    <p>
                        {t('about.team.p1')}
                    </p>
                    <p>
                        {t('about.team.p2')}
                    </p>
                </div>
             </div>

             {/* Visual Content */}
             <div className="md:order-1 grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10 text-center">
                    <Users className="w-10 h-10 mx-auto mb-3 text-corporate-red" />
                    <h3 className="font-bold">Experts Qualifiés</h3>
                </div>
                <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10 text-center">
                    <Briefcase className="w-10 h-10 mx-auto mb-3 text-corporate-red" />
                    <h3 className="font-bold">Savoir-faire</h3>
                </div>
                <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10 text-center col-span-2">
                    <Award className="w-10 h-10 mx-auto mb-3 text-corporate-red" />
                    <h3 className="font-bold">Engagement Qualité</h3>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats / Trust Banner */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <span className="block text-4xl font-bold text-corporate-blue mb-2">2001</span>
                    <span className="text-gray-600 text-sm">Année de création</span>
                </div>
                <div>
                    <span className="block text-4xl font-bold text-corporate-blue mb-2">+2000</span>
                    <span className="text-gray-600 text-sm">Clients satisfaits</span>
                </div>
                <div>
                    <span className="block text-4xl font-bold text-corporate-blue mb-2">100%</span>
                    <span className="text-gray-600 text-sm">Engagement</span>
                </div>
                <div>
                    <span className="block text-4xl font-bold text-corporate-blue mb-2">24/7</span>
                    <span className="text-gray-600 text-sm">Support disponible</span>
                </div>
            </div>
            <div className="mt-12">
                <Link to="/contact">
                    <Button>Contactez-nous</Button>
                </Link>
            </div>
         </div>
      </section>
    </div>
  );
};
