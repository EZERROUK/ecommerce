
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Check, Server, Monitor, Cpu, Settings } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

export const Configurator: React.FC = () => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [selections, setSelections] = useState({
    usage: '',
    budget: '',
    brand: ''
  });

  const STEPS = [
    { id: 1, title: t('configurator_data.steps.usage') },
    { id: 2, title: t('configurator_data.steps.budget') },
    { id: 3, title: t('configurator_data.steps.prefs') },
    { id: 4, title: t('configurator_data.steps.result') },
  ];

  const handleSelect = (key: string, value: string) => {
    setSelections({ ...selections, [key]: value });
    if (currentStep < 3) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    } else {
        setCurrentStep(4);
    }
  };

  const renderStep1 = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { id: 'office', label: t('configurator_data.usage.office'), icon: Monitor },
        { id: 'server', label: t('configurator_data.usage.server'), icon: Server },
        { id: 'workstation', label: t('configurator_data.usage.workstation'), icon: Cpu },
      ].map((opt) => (
        <button
          key={opt.id}
          onClick={() => handleSelect('usage', opt.id)}
          className={`p-8 border-2 rounded-xl text-center transition-all hover:border-corporate-blue hover:bg-blue-50 group ${selections.usage === opt.id ? 'border-corporate-blue bg-blue-50' : 'border-gray-200 bg-white'}`}
        >
          <div className="flex justify-center mb-4">
            <opt.icon className={`w-12 h-12 ${selections.usage === opt.id ? 'text-corporate-blue' : 'text-gray-400 group-hover:text-corporate-blue'}`} />
          </div>
          <h3 className="font-bold text-gray-900">{opt.label}</h3>
        </button>
      ))}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      {['Économique (< 5000 MAD)', 'Standard (5000 - 10000 MAD)', 'Premium (> 10000 MAD)', 'Budget Entreprise (Sur mesure)'].map((budget) => (
        <button
          key={budget}
          onClick={() => handleSelect('budget', budget)}
          className={`w-full p-4 text-left border rounded-lg transition-all hover:bg-gray-50 flex items-center justify-between ${selections.budget === budget ? 'border-corporate-blue ring-1 ring-corporate-blue bg-blue-50' : 'border-gray-200'}`}
        >
          <span className="font-medium text-gray-700">{budget}</span>
          {selections.budget === budget && <Check className="w-5 h-5 text-corporate-blue" />}
        </button>
      ))}
    </div>
  );

  const renderStep3 = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {['HP', 'Dell', 'Lenovo', 'Indifférent'].map((brand) => (
        <button
          key={brand}
          onClick={() => handleSelect('brand', brand)}
          className={`p-6 border rounded-lg text-center font-bold text-gray-700 hover:border-corporate-blue hover:text-corporate-blue transition-all ${selections.brand === brand ? 'border-corporate-blue text-corporate-blue bg-blue-50' : 'border-gray-200'}`}
        >
          {brand}
        </button>
      ))}
    </div>
  );

  const renderResult = () => (
    <div className="text-center animate-fade-in-up">
      <div className="inline-block p-4 rounded-full bg-green-100 text-green-600 mb-6">
        <Check className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-bold text-corporate-blue mb-4">{t('configurator_data.result.found')}</h2>
      <p className="text-gray-600 mb-8 max-w-lg mx-auto">
        Basé sur vos choix ({selections.usage}, {selections.budget}, {selections.brand}), 
        nos experts recommandent la gamme professionnelle <strong>EliteBook / ProLiant</strong>.
      </p>
      
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-md mx-auto mb-8 text-left">
        <h3 className="font-bold text-lg mb-2">{t('configurator_data.result.pack')}</h3>
        <ul className="space-y-2 text-sm text-gray-600 mb-6">
            <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500"/> {t('configurator_data.result.perf')} {selections.usage}</li>
            <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500"/> {t('configurator_data.result.warranty')}</li>
            <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500"/> {t('configurator_data.result.install')}</li>
        </ul>
        <Link to="/contact">
            <Button className="w-full">{t('configurator_data.result.cta')}</Button>
        </Link>
      </div>

      <button onClick={() => setCurrentStep(1)} className="text-gray-500 hover:text-corporate-red text-sm underline">
        {t('configurator_data.result.retry')}
      </button>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <SEO title={t('configurator_data.title')} description={t('configurator_data.subtitle')} />
      
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-corporate-blue font-heading mb-2 flex items-center justify-center">
            <Settings className="w-8 h-8 mr-3" />
            {t('configurator_data.title')}
          </h1>
          <p className="text-gray-600">{t('configurator_data.subtitle')}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <span key={step.id} className={`text-sm font-semibold ${currentStep >= step.id ? 'text-corporate-blue' : 'text-gray-400'}`}>
                {step.title}
              </span>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
                className="bg-corporate-red h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 min-h-[400px] flex flex-col justify-center">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderResult()}
        </div>
      </div>
    </div>
  );
};
