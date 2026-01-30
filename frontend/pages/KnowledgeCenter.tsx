
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Clock, FileText, ChevronRight } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useLanguage } from '../contexts/LanguageContext';
import { knowledgeBase } from '../data/knowledge';
import { LazyImage } from '../components/LazyImage';
import { PrefetchLink } from '../components/PrefetchLink';

export const KnowledgeCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const filteredArticles = knowledgeBase.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    article.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const knowledgeSchema = {
    '@type': 'CollectionPage',
    name: t('knowledgePage.title'),
    description: t('knowledgePage.subtitle'),
    url: 'https://x-zone.ma/knowledge',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: knowledgeBase
        .filter((a) => a?.slug && a?.title)
        .map((a, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `https://x-zone.ma/knowledge/${a.slug}`,
          name: a.title,
        })),
    },
  };

  return (
    <div className="bg-white min-h-screen">
      <SEO
        title={t('knowledgePage.title')}
        description={t('knowledgePage.subtitle')}
        canonicalPath="/knowledge"
        schema={knowledgeSchema}
      />

      {/* Header */}
      <div className="bg-corporate-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-corporate-red mb-4" />
          <h1 className="text-4xl font-bold font-heading mb-4">{t('knowledgePage.title')}</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            {t('knowledgePage.subtitle')}
          </p>
          
          <div className="max-w-xl mx-auto relative">
            <input 
                type="text" 
                placeholder={t('knowledgePage.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:outline-none shadow-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredArticles.length > 0 ? (
                filteredArticles.map(article => (
                    <div key={article.id} className="flex bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
                         {article.image && (
                           <PrefetchLink to={`/knowledge/${article.slug}`} className="w-1/3 hidden sm:block overflow-hidden relative" prefetch="both">
                             <LazyImage src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" width={900} height={600} loading="lazy" />
                                 <div className="absolute inset-0 bg-corporate-blue/10"></div>
                           </PrefetchLink>
                         )}
                         <div className="p-6 flex-1 flex flex-col justify-center">
                             <div className="text-xs font-bold text-corporate-red mb-2 uppercase tracking-wide">Guide Technique</div>
                              <PrefetchLink to={`/knowledge/${article.slug}`} prefetch="both">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight font-heading hover:text-corporate-blue transition-colors">{article.title}</h3>
                              </PrefetchLink>
                             <p className="text-sm text-gray-600 mb-4 line-clamp-2">{article.summary}</p>
                             <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                                 <div className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {article.readingTime} {t('knowledgePage.readTime')}</div>
                                 <PrefetchLink to={`/knowledge/${article.slug}`} className="text-corporate-blue font-semibold flex items-center hover:underline" prefetch="both">
                                     {t('knowledgePage.readMore')} <ChevronRight className="w-3 h-3 ml-1" />
                                 </PrefetchLink>
                             </div>
                         </div>
                    </div>
                ))
            ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{t('knowledgePage.noResults')}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
