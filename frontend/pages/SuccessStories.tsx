
import React from 'react';
import { Link } from 'react-router-dom';
import { Quote, ArrowRight, CheckCircle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { SUCCESS_STORIES } from '../constants';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { LazyImage } from '../components/LazyImage';
import { PrefetchLink } from '../components/PrefetchLink';

export const SuccessStories: React.FC = () => {
  const { t } = useLanguage();
  const stories = t('stories_data') as unknown as any[];

  return (
    <div className="bg-white">
      <SEO title="Success Stories" description="Découvrez comment X-Zone Technologie accompagne les entreprises marocaines vers le succès." />

      <div className="bg-corporate-blue text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">Cas Clients</span>
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6">Ils nous font confiance</h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
                Plongée au cœur des projets de transformation numérique de nos clients.
            </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-24">
            {SUCCESS_STORIES.map((staticStory, index) => {
                const story = stories[index] || stories[0]; // Fallback to translated array
                return (
                <div key={staticStory.id} className={`flex flex-col md:flex-row gap-16 items-start ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    
                    {/* Visual Section */}
                    <div className="w-full md:w-1/2">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                            <LazyImage src={staticStory.image} alt={story.client} className="w-full h-80 object-cover transform group-hover:scale-105 transition-transform duration-700" width={1200} height={800} loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-6 left-6">
                                <span className="bg-corporate-red text-white px-4 py-1 font-bold text-xs uppercase tracking-widest rounded-full mb-2 inline-block">
                                    {staticStory.sector}
                                </span>
                                {staticStory.logo && (
                                    <div className="bg-white p-2 rounded w-24 opacity-90 mt-2">
                                        <LazyImage src={staticStory.logo} alt="Client Logo" className="w-full h-auto grayscale" width={200} height={120} loading="lazy" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="w-full md:w-1/2">
                        <h2 className="text-3xl font-bold text-corporate-blue mb-2 font-heading">{story.client}</h2>
                        <h3 className="text-xl font-semibold text-gray-700 mb-8 leading-relaxed">{story.title}</h3>
                        
                        <div className="space-y-8">
                            <div className="relative pl-8 border-l-2 border-corporate-red">
                                <h4 className="font-bold text-gray-900 mb-2 text-lg">Le Défi</h4>
                                <p className="text-gray-600 leading-relaxed">{story.challenge}</p>
                            </div>
                            
                            <div className="relative pl-8 border-l-2 border-corporate-blue">
                                <h4 className="font-bold text-gray-900 mb-2 text-lg">La Solution X-Zone</h4>
                                <p className="text-gray-600 leading-relaxed">{story.solution}</p>
                            </div>

                             <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <div className="flex items-start">
                                    <Quote className="w-8 h-8 text-corporate-red mr-4 flex-shrink-0 opacity-50" />
                                    <div>
                                        <p className="italic text-gray-700 font-medium mb-3">"{story.result}"</p>
                                        <div className="flex items-center text-green-600 text-sm font-bold">
                                            <CheckCircle className="w-4 h-4 mr-2" /> Objectifs atteints à 100%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                             <PrefetchLink to="/contact" prefetch="both">
                                <Button variant="outline">Discuter d'un projet similaire</Button>
                            </PrefetchLink>
                        </div>
                    </div>
                </div>
            )})}
        </div>

        <div className="mt-24 text-center bg-gray-50 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-corporate-blue mb-6">Prêt à écrire votre propre histoire ?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">Nos experts sont prêts à relever vos défis technologiques, quelle que soit leur complexité.</p>
            <PrefetchLink to="/contact" prefetch="both">
                <Button size="lg">Contactez nos experts</Button>
            </PrefetchLink>
        </div>
      </div>
    </div>
  );
};
