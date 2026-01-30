
import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Check, ArrowRight, GraduationCap, Building, HeartPulse, Headphones, Landmark, Settings, Package, LucideIcon } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/Button';
import { SECTORS, PRODUCTS, SUCCESS_STORIES, DEFAULT_PRODUCT_IMAGE } from '../constants';
import { TrustBadges } from '../components/TrustBadges';
import { useLanguage } from '../contexts/LanguageContext';

const icons: { [key: string]: LucideIcon } = {
  GraduationCap, Building, HeartPulse, Headphones, Landmark, Settings, Package
};

export const SectorDetail: React.FC = () => {
  const { sectorId } = useParams<{ sectorId: string }>();
  const { t } = useLanguage();
  const sector = SECTORS.find(s => s.id === sectorId);

  if (!sector) {
    return <Navigate to="/" replace />;
  }

  // Retrieve translations with fallback
  const title = t(`sectors_data.${sector.id}.title`);
  const description = t(`sectors_data.${sector.id}.description`);

  const Icon = icons[sector.icon] || Building;
  // Fix: Use translated title instead of non-existent sector.title property
  const searchTitle = typeof title === 'string' ? title : '';
  const relatedStory = SUCCESS_STORIES.find(s => s.sector.toLowerCase().includes(searchTitle.toLowerCase())) || SUCCESS_STORIES[0];
  
  const challengesRaw = t(`sectors_data.${sector.id}.challenges`);
  const challenges = Array.isArray(challengesRaw) ? challengesRaw : [];
  
  const solutionsRaw = t(`sectors_data.${sector.id}.solutions`);
  const solutions = Array.isArray(solutionsRaw) ? solutionsRaw : [];

  // Translated story mock (using index 0 for fallback simplicity, ideally should map by id)
  const storiesRaw = t('stories_data');
  const stories = Array.isArray(storiesRaw) ? storiesRaw : [];
  const storyIndex = SUCCESS_STORIES.indexOf(relatedStory) !== -1 ? SUCCESS_STORIES.indexOf(relatedStory) : 0;
  const tStory = stories[storyIndex] || stories[0] || {};

  return (
    <div className="bg-white">
      <SEO title={title} description={description} />

      {/* Hero */}
      <div className="relative bg-corporate-blue text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
            <img 
              src={sector.image} 
              alt={title} 
              className="w-full h-full object-cover object-center" 
              loading="eager"
            />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="bg-white/10 p-6 rounded-full backdrop-blur-sm">
                    <Icon className="w-16 h-16 text-corporate-red" />
                </div>
                <div>
                    <span className="text-corporate-red font-bold uppercase tracking-widest text-sm mb-2 block">{t('sectorPage.tag')}</span>
                    <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">{title}</h1>
                    <p className="text-xl text-blue-100 max-w-2xl">{description}</p>
                </div>
            </div>
        </div>
      </div>

      <TrustBadges />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
                <h2 className="text-3xl font-bold text-corporate-blue mb-6 font-heading">{t('sectorPage.challengesTitle')}</h2>
                <p className="text-gray-600 mb-8 text-lg">
                    {t('sectorPage.challengesIntro')}
                </p>
                
                <div className="space-y-6">
                    <div className="bg-red-50 p-6 rounded-lg border-l-4 border-corporate-red">
                        <h3 className="font-bold text-gray-900 mb-4">{t('sectorPage.problems')}</h3>
                        <ul className="space-y-2">
                            {challenges.map((c: string, i: number) => (
                                <li key={i} className="flex items-center text-gray-700">
                                    <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-corporate-blue">
                        <h3 className="font-bold text-gray-900 mb-4">{t('sectorPage.solution')}</h3>
                        <ul className="space-y-2">
                             {solutions.map((s: string, i: number) => (
                                <li key={i} className="flex items-center text-gray-700">
                                    <Check className="w-5 h-5 text-green-500 mr-3" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-10">
                    <Link to="/contact">
                        <Button>{t('sectorPage.cta')} {title}</Button>
                    </Link>
                </div>
            </div>
            
            {/* Right Column: Visual + Case Study */}
            <div className="space-y-8">
                 <img src={sector.image} alt={title} className="rounded-xl shadow-2xl w-full object-cover object-center h-64" loading="lazy" />
                 
                 <div className="bg-gray-900 text-white p-8 rounded-xl relative overflow-hidden">
                     <div className="relative z-10">
                         <span className="text-corporate-red text-xs font-bold uppercase mb-2 block">{t('sectorPage.successStory')}</span>
                         <h3 className="text-xl font-bold mb-2">{tStory.client}</h3>
                         <p className="text-gray-400 text-sm mb-4">"{tStory.result}"</p>
                         <Link to="/success-stories" className="text-white underline text-sm hover:text-corporate-red">{t('sectorPage.readCase')}</Link>
                     </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Recommended Products */}
      <div className="bg-gray-50 py-20">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <h2 className="text-3xl font-bold text-corporate-blue mb-10 text-center font-heading">{t('sectorPage.recommendedGear')}</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PRODUCTS.slice(0, 3).map(product => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                        <img 
                            src={product.image || DEFAULT_PRODUCT_IMAGE} 
                            alt={product.name} 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                            }}
                            className="h-40 w-full object-contain mb-4" 
                        />
                        <h3 className="font-bold text-gray-900 mb-2 truncate">{product.name}</h3>
                        <Link to={`/produits/${(product as any).slug || product.id}`} className="text-corporate-blue font-bold text-sm flex items-center hover:text-corporate-red">
                            {t('common.seeProduct')} <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                ))}
             </div>
         </div>
      </div>
    </div>
  );
};
