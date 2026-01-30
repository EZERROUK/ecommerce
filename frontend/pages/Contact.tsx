
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/Button';
import { COMPANY_INFO } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

export const Contact: React.FC = () => {
  const { search } = useLocation();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  // Effect to pre-fill form based on URL query params
  useEffect(() => {
    const params = new URLSearchParams(search);
    const productName = params.get('product');
    const subjectParam = params.get('subject');
    
    // Config parameters
    const ram = params.get('ram');
    const storage = params.get('storage');
    const cpu = params.get('cpu');
    const isCustomConfig = params.get('type') === 'custom_config';

    if (subjectParam) {
        setFormData(prev => ({ ...prev, subject: 'devis' }));
    }

    if (productName) {
      let msg = '';

      if (isCustomConfig) {
          msg = `Produit : ${decodeURIComponent(productName)}\nRAM : ${ram || 'Standard'}\nStockage : ${storage || 'Standard'}\nProcesseur : ${cpu || 'Standard'}`;
          
          setFormData(prev => ({
            ...prev,
            subject: 'devis',
            message: msg
          }));
      } else {
          const config = params.get('config');
          msg = `Produit : "${decodeURIComponent(productName)}".`;
          
          if (config) {
              msg += `\nConfiguration : ${decodeURIComponent(config)}`;
          }

          setFormData(prev => ({
            ...prev,
            subject: 'devis',
            message: msg
          }));
      }
    }
  }, [search]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const inputStyle = "w-full px-4 py-3 rounded-lg border border-gray-200 bg-[#F5F5F5] text-[#1A1A1A] placeholder-gray-500 focus:ring-2 focus:ring-corporate-blue focus:border-transparent outline-none transition-all rtl:text-right";

  return (
    <div className="bg-white">
      <SEO 
        title={t('meta.contactTitle')} 
        description={t('meta.contactDesc')} 
      />

      <div className="bg-corporate-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold font-heading mb-4">{t('contact.header.title')}</h1>
          <p className="text-xl text-gray-300">
            {t('contact.header.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-corporate-blue mb-8 font-heading">{t('contact.info.title')}</h2>
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-corporate-blue">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="ml-6 rtl:mr-6 rtl:ml-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t('contact.info.address')}</h3>
                  <p className="text-gray-600">{t('contact.info.addressValue')}</p>
                  <p className="text-gray-600">{COMPANY_INFO.location}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-corporate-blue">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="ml-6 rtl:mr-6 rtl:ml-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t('contact.info.phone')}</h3>
                  <p className="text-gray-600">{t('contact.info.standard')}: <a href={`tel:${COMPANY_INFO.phone}`} className="hover:text-corporate-red" dir="ltr">{COMPANY_INFO.phone}</a></p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-corporate-blue">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="ml-6 rtl:mr-6 rtl:ml-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t('contact.info.email')}</h3>
                  <p className="text-gray-600">{t('contact.info.commercial')}: <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-corporate-red">{COMPANY_INFO.email}</a></p>
                  <p className="text-gray-600">{t('contact.info.support')}: support@x-zone.ma</p>
                </div>
              </div>

               <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-corporate-blue">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="ml-6 rtl:mr-6 rtl:ml-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t('contact.info.hours')}</h3>
                  <p className="text-gray-600">{t('contact.info.openHours')}</p>
                  <p className="text-gray-600">{t('contact.info.saturday')}</p>
                  <p className="text-gray-600">{t('contact.info.closed')}</p>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="mt-12 h-64 bg-gray-200 rounded-lg overflow-hidden shadow-sm">
                <iframe 
                    title="X-Zone Map"
                    src={COMPANY_INFO.mapUrl} 
                    width="100%" 
                    height="100%" 
                    style={{border:0}} 
                    allowFullScreen={true} 
                    loading="lazy"
                ></iframe>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-corporate-blue mb-6 font-heading">{t('contact.form.title')}</h2>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg text-center">
                <h3 className="text-lg font-bold mb-2">{t('contact.form.successTitle')}</h3>
                <p>{t('contact.form.successDesc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('contact.form.name')}</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className={inputStyle}
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">{t('contact.form.phone')}</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      className={inputStyle}
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('contact.form.email')}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className={inputStyle}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">{t('contact.form.subject')}</label>
                  <select
                    id="subject"
                    name="subject"
                    className={inputStyle}
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="">{t('contact.form.subjects.select')}</option>
                    <option value="devis">{t('contact.form.subjects.quote')}</option>
                    <option value="info">{t('contact.form.subjects.info')}</option>
                    <option value="support">{t('contact.form.subjects.support')}</option>
                    <option value="partenariat">{t('contact.form.subjects.partner')}</option>
                    <option value="autre">{t('contact.form.subjects.other')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">{t('contact.form.message')}</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={8}
                    required
                    className={`${inputStyle} [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-[#F2F2F2] [&::-webkit-scrollbar-track]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-[#CCCCCC] [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb:hover]:bg-[#BBBBBB]`}
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <Button type="submit" className="w-full">
                  {t('contact.form.submit')}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-4">
                  {t('contact.form.disclaimer')}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
