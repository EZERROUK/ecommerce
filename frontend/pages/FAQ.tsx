import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

export const FAQ: React.FC = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openItemIndex, setOpenItemIndex] = useState<number | null>(null);

  // Retrieve FAQ data from translations
  const faqData = t('faq_data') as unknown as any[];
  
  // Reconstruct with categories matching translation structure
  // Note: Ensure translations.ts faq_data has 'category' property if needed for logic, 
  // or rely on mapping if data structure is preserved.
  // In previous step we added category to translation object directly.
  
  const categories = [
      { id: 'all', label: t('faqPage.categories.all') },
      { id: 'vente', label: t('faqPage.categories.vente') },
      { id: 'location', label: t('faqPage.categories.location') },
      { id: 'support', label: t('faqPage.categories.support') },
      { id: 'services', label: t('faqPage.categories.services') },
  ];

  const filteredItems = Array.isArray(faqData) ? (activeCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item?.category === activeCategory)) : [];

    const faqSchema = {
        '@type': 'FAQPage',
        mainEntity: (Array.isArray(faqData) ? faqData : [])
            .filter((x) => x?.question && x?.answer)
            .map((x) => ({
                '@type': 'Question',
                name: String(x.question),
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: String(x.answer),
                },
            })),
    };

  const toggleItem = (index: number) => {
      setOpenItemIndex(openItemIndex === index ? null : index);
  };

  return (
    <div className="bg-white min-h-screen">
            <SEO
                title={t('faqPage.title')}
                description={t('faqPage.subtitle')}
                canonicalPath="/faq"
                schema={faqSchema}
            />

      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-corporate-blue font-heading mb-4">{t('faqPage.title')}</h1>
            <p className="text-xl text-gray-600">{t('faqPage.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setOpenItemIndex(null); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeCategory === cat.id 
                        ? 'bg-corporate-blue text-white shadow-md' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    {cat.label}
                </button>
            ))}
        </div>

        {/* Accordion */}
        <div className="space-y-4">
            {filteredItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                    <button
                        onClick={() => toggleItem(index)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none hover:bg-gray-50 transition-colors"
                    >
                        <span className="font-bold text-gray-800 text-lg">{item.question}</span>
                        {openItemIndex === index ? (
                            <ChevronUp className="w-5 h-5 text-corporate-red" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </button>
                    <div 
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            openItemIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                    >
                        <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                            {item.answer}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-16 bg-blue-50 border border-blue-100 rounded-xl p-8 text-center">
            <HelpCircle className="w-10 h-10 text-corporate-blue mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('faqPage.noResults')}</h3>
            <p className="text-gray-600 mb-6">{t('faqPage.expertText')}</p>
            <div className="flex justify-center gap-4">
                <Link to="/contact">
                    <Button>{t('faqPage.contactUs')}</Button>
                </Link>
                <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer">
                    <Button variant="white" className="border border-gray-200">
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" /> WhatsApp
                    </Button>
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};