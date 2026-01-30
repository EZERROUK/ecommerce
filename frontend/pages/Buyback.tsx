import React, { useState, ChangeEvent } from 'react';
import { Recycle, Package, Check, Camera, Cpu, HardDrive, Monitor, Battery, Zap, Server, AlertCircle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

type MaterialType = 'laptop' | 'desktop' | 'server' | 'screen' | 'other';

interface FormData {
  type: MaterialType;
  brand: string;
  model: string;
  year: string;
  condition: string;
  functional: string;
  // Dynamic fields
  processor: string;
  ram: string;
  storage: string;
  screenSize: string;
  gpu: string;
  batteryState: string;
  charger: string;
  format: string;
  cpuCount: string;
  raid: string;
  resolution: string;
  panelType: string;
  connectivity: string;
  defects: string;
  description: string;
  // Contact
  email: string;
  phone: string;
}

const RAM_OPTIONS = [
  "4 Go",
  "8 Go",
  "16 Go",
  "32 Go",
  "64 Go",
  "Plus de 64 Go"
];

const SCREEN_SIZES = [
  "11.6\"",
  "12.5\"",
  "13.3\"",
  "14\"",
  "15.6\"",
  "16\"",
  "17.3\""
];

export const Buyback: React.FC = () => {
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<FormData>({
    type: 'laptop',
    brand: '',
    model: '',
    year: '',
    condition: 'good',
    functional: 'yes',
    processor: '',
    ram: '',
    storage: '',
    screenSize: '',
    gpu: '',
    batteryState: 'good',
    charger: 'yes',
    format: 'tower',
    cpuCount: '1',
    raid: 'no',
    resolution: '',
    panelType: '',
    connectivity: '',
    defects: '',
    description: '',
    email: '',
    phone: ''
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Standardized Input Style
  // Added [appearance:textfield]... to remove default ugly black spinners on number inputs
  const inputStyle = "w-full px-4 py-3 rounded-lg border border-gray-200 bg-[#F5F5F5] text-[#1A1A1A] placeholder-gray-500 focus:ring-2 focus:ring-corporate-blue focus:border-transparent outline-none transition-all text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const labelStyle = "block text-xs font-bold text-gray-700 uppercase mb-1 tracking-wide";

  const renderDynamicFields = () => {
    switch (formData.type) {
      case 'laptop':
        return (
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-corporate-blue flex items-center mb-4 border-b border-blue-200 pb-2">
              <Cpu className="w-4 h-4 mr-2" /> Configuration PC Portable
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Processeur (CPU)</label>
                <input name="processor" value={formData.processor} onChange={handleChange} className={inputStyle} placeholder="Ex: Intel Core i5-1135G7" />
              </div>
              <div>
                <label className={labelStyle}>Mémoire RAM</label>
                <select name="ram" value={formData.ram} onChange={handleChange} className={inputStyle}>
                  <option value="">Sélectionner</option>
                  {RAM_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelStyle}>Stockage (Type & Capacité)</label>
                <input name="storage" value={formData.storage} onChange={handleChange} className={inputStyle} placeholder="Ex: 512 Go SSD NVMe" />
              </div>
              <div>
                <label className={labelStyle}>Taille d'écran</label>
                <select name="screenSize" value={formData.screenSize} onChange={handleChange} className={inputStyle}>
                  <option value="">Sélectionner la taille</option>
                  {SCREEN_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>Carte Graphique (GPU)</label>
                <input name="gpu" value={formData.gpu} onChange={handleChange} className={inputStyle} placeholder="Ex: Intel Iris Xe ou RTX 3050" />
              </div>
              
              {/* Asymmetric Grid for Battery/Charger to fix text truncation */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelStyle}>État de la batterie</label>
                  <select name="batteryState" value={formData.batteryState} onChange={handleChange} className={inputStyle}>
                    <option value="excellent">Excellente autonomie</option>
                    <option value="good">Bonne autonomie</option>
                    <option value="average">Autonomie moyenne</option>
                    <option value="weak">Batterie faible / à remplacer</option>
                    <option value="dead">Batterie HS</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className={labelStyle}>Chargeur inclus ?</label>
                  <select name="charger" value={formData.charger} onChange={handleChange} className={inputStyle}>
                    <option value="yes">Oui</option>
                    <option value="no">Non</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'desktop':
        return (
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-corporate-blue flex items-center mb-4 border-b border-blue-200 pb-2">
              <Monitor className="w-4 h-4 mr-2" /> Configuration PC Fixe
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Format</label>
                <select name="format" value={formData.format} onChange={handleChange} className={inputStyle}>
                  <option value="tower">Tour (Tower)</option>
                  <option value="sff">SFF (Small Form Factor)</option>
                  <option value="micro">Micro / Mini PC</option>
                  <option value="aio">All-in-One (Tout-en-un)</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Processeur (CPU)</label>
                <input name="processor" value={formData.processor} onChange={handleChange} className={inputStyle} placeholder="Ex: Intel Core i7-10700" />
              </div>
              <div>
                <label className={labelStyle}>Mémoire RAM</label>
                <select name="ram" value={formData.ram} onChange={handleChange} className={inputStyle}>
                  <option value="">Sélectionner</option>
                  {RAM_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelStyle}>Stockage</label>
                <input name="storage" value={formData.storage} onChange={handleChange} className={inputStyle} placeholder="Ex: 1TB HDD + 256GB SSD" />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>Carte Graphique (GPU)</label>
                <input name="gpu" value={formData.gpu} onChange={handleChange} className={inputStyle} placeholder="Ex: Nvidia RTX 3060 ou Intégrée" />
              </div>
            </div>
          </div>
        );

      case 'server':
        return (
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-corporate-blue flex items-center mb-4 border-b border-blue-200 pb-2">
              <Server className="w-4 h-4 mr-2" /> Configuration Serveur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelStyle}>Format</label>
                <select name="format" value={formData.format} onChange={handleChange} className={inputStyle}>
                  <option value="rack1u">Rack 1U</option>
                  <option value="rack2u">Rack 2U+</option>
                  <option value="tower">Tour</option>
                  <option value="blade">Blade</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>Modèle Exact</label>
                <input name="model" value={formData.model} onChange={handleChange} className={inputStyle} placeholder="Ex: Dell PowerEdge R740" />
              </div>
              <div>
                <label className={labelStyle}>Nb. Processeurs</label>
                <input name="cpuCount" type="number" value={formData.cpuCount} onChange={handleChange} className={inputStyle} placeholder="Ex: 2" />
              </div>
              <div>
                <label className={labelStyle}>Modèle CPU</label>
                <input name="processor" value={formData.processor} onChange={handleChange} className={inputStyle} placeholder="Ex: Xeon Gold 6130" />
              </div>
              <div>
                <label className={labelStyle}>RAM Totale (Go)</label>
                <input name="ram" value={formData.ram} onChange={handleChange} className={inputStyle} placeholder="Ex: 128" />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>Stockage (Détail)</label>
                <input name="storage" value={formData.storage} onChange={handleChange} className={inputStyle} placeholder="Ex: 4x 1.2TB SAS 10k + 2x 480GB SSD" />
              </div>
              <div>
                <label className={labelStyle}>Carte RAID ?</label>
                <select name="raid" value={formData.raid} onChange={handleChange} className={inputStyle}>
                  <option value="yes">Oui (PERC/HP SmartArray...)</option>
                  <option value="no">Non / Software</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'screen':
        return (
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-corporate-blue flex items-center mb-4 border-b border-blue-200 pb-2">
              <Monitor className="w-4 h-4 mr-2" /> Détails Écran
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Taille (Pouces)</label>
                <input name="screenSize" type="number" value={formData.screenSize} onChange={handleChange} className={inputStyle} placeholder="Ex: 27" />
              </div>
              <div>
                <label className={labelStyle}>Résolution</label>
                <input name="resolution" value={formData.resolution} onChange={handleChange} className={inputStyle} placeholder="Ex: Full HD (1920x1080) ou 4K" />
              </div>
              <div>
                <label className={labelStyle}>Type de Dalle</label>
                <input name="panelType" value={formData.panelType} onChange={handleChange} className={inputStyle} placeholder="Ex: IPS, VA, TN..." />
              </div>
              <div>
                <label className={labelStyle}>Connectique</label>
                <input name="connectivity" value={formData.connectivity} onChange={handleChange} className={inputStyle} placeholder="Ex: HDMI, DisplayPort, USB-C" />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>Défauts Visuels (Pixels morts, rayures...)</label>
                <input name="defects" value={formData.defects} onChange={handleChange} className={inputStyle} placeholder="R.A.S ou décrire..." />
              </div>
            </div>
          </div>
        );

      default: // Other
        return (
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-corporate-blue flex items-center mb-4 border-b border-blue-200 pb-2">
              <AlertCircle className="w-4 h-4 mr-2" /> Autre Matériel
            </h3>
            <div>
                <label className={labelStyle}>Catégorie</label>
                <input name="brand" value={formData.brand} onChange={handleChange} className={inputStyle} placeholder="Ex: Switch Réseau, Imprimante, Onduleur..." />
            </div>
            <div>
                <label className={labelStyle}>Description détaillée (Obligatoire)</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={4} 
                  className={inputStyle} 
                  placeholder="Décrivez la marque, le modèle, les spécificités techniques et l'état général..."
                ></textarea>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <SEO 
        title={t('buyback_data.hero.title')} 
        description={t('buyback_data.hero.subtitle')} 
      />
      
      {/* Custom Scrollbar Styles */}
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1; /* slate-300 */
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; /* slate-400 */
        }
        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f1f1;
        }
      `}</style>

      {/* Hero */}
      <div className="bg-corporate-blue text-white py-20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/2 h-full bg-white/5 skew-x-12 transform translate-x-20"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0">
                  <div className="inline-flex items-center px-4 py-2 bg-green-500/20 text-green-300 rounded-full mb-6 border border-green-500/30">
                      <Recycle className="w-4 h-4 mr-2" /> {t('buyback_data.hero.badge')}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6 leading-tight">
                      {t('buyback_data.hero.title')}
                  </h1>
                  <p className="text-xl text-blue-100 mb-8">
                      {t('buyback_data.hero.subtitle')}
                  </p>
                  <Button variant="primary">{t('buyback_data.hero.cta')}</Button>
              </div>
              <div className="md:w-1/2 flex justify-center">
                  <Package className="w-64 h-64 text-white/20" />
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Steps */}
              <div className="lg:col-span-1 space-y-12">
                  <h2 className="text-2xl font-bold text-corporate-blue mb-6">{t('buyback_data.steps.title')}</h2>
                  {[
                      { step: 1, title: t('buyback_data.steps.s1.title'), desc: t('buyback_data.steps.s1.desc') },
                      { step: 2, title: t('buyback_data.steps.s2.title'), desc: t('buyback_data.steps.s2.desc') },
                      { step: 3, title: t('buyback_data.steps.s3.title'), desc: t('buyback_data.steps.s3.desc') },
                      { step: 4, title: t('buyback_data.steps.s4.title'), desc: t('buyback_data.steps.s4.desc') },
                  ].map((s) => (
                      <div key={s.step} className="flex">
                          <div className="flex-shrink-0 mr-4">
                              <div className="w-8 h-8 rounded-full bg-corporate-red text-white flex items-center justify-center font-bold shadow-lg">
                                  {s.step}
                              </div>
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-900">{s.title}</h3>
                              <p className="text-sm text-gray-600">{s.desc}</p>
                          </div>
                      </div>
                  ))}
              </div>

              {/* Advanced Dynamic Form */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
                  <h2 className="text-2xl font-bold text-corporate-blue mb-8 font-heading text-center">{t('buyback_data.form.title')}</h2>
                  
                  <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                      
                      {/* Section 1: General Info */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Informations Générales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className={labelStyle}>{t('buyback_data.form.type')}</label>
                                <select 
                                  name="type" 
                                  value={formData.type} 
                                  onChange={handleChange} 
                                  className={`${inputStyle} text-corporate-blue font-bold`}
                                >
                                    <option value="laptop">{t('buyback_data.form.options.type.laptop')}</option>
                                    <option value="desktop">{t('buyback_data.form.options.type.desktop')}</option>
                                    <option value="server">{t('buyback_data.form.options.type.server')}</option>
                                    <option value="screen">{t('buyback_data.form.options.type.screen')}</option>
                                    <option value="other">{t('buyback_data.form.options.type.other')}</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>{t('buyback_data.form.brand')}</label>
                                <input name="brand" value={formData.brand} onChange={handleChange} className={inputStyle} placeholder={t('buyback_data.form.placeholders.brand')} />
                            </div>
                            <div>
                                <label className={labelStyle}>Modèle (Optionnel)</label>
                                <input name="model" value={formData.model} onChange={handleChange} className={inputStyle} placeholder="Ex: Latitude 5420" />
                            </div>
                            <div>
                                <label className={labelStyle}>{t('buyback_data.form.year')}</label>
                                <input name="year" type="number" value={formData.year} onChange={handleChange} className={inputStyle} placeholder={t('buyback_data.form.placeholders.year')} />
                            </div>
                            <div>
                                <label className={labelStyle}>{t('buyback_data.form.condition')}</label>
                                <select name="condition" value={formData.condition} onChange={handleChange} className={inputStyle}>
                                    <option value="likeNew">{t('buyback_data.form.options.condition.likeNew')}</option>
                                    <option value="good">{t('buyback_data.form.options.condition.good')}</option>
                                    <option value="wear">{t('buyback_data.form.options.condition.wear')}</option>
                                    <option value="broken">{t('buyback_data.form.options.condition.broken')}</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Fonctionnel ?</label>
                                <select name="functional" value={formData.functional} onChange={handleChange} className={inputStyle}>
                                    <option value="yes">Oui, 100%</option>
                                    <option value="partial">Partiellement (Défauts)</option>
                                    <option value="no">Non (HS)</option>
                                </select>
                            </div>
                        </div>
                      </div>

                      {/* Section 2: Dynamic Technical Specs */}
                      {renderDynamicFields()}
                      
                      {/* Section 3: Evidence */}
                      <div>
                          <label className={labelStyle}>{t('buyback_data.form.photos')} (Obligatoire)</label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors cursor-pointer bg-[#F5F5F5] group">
                              <div className="space-y-1 text-center">
                                  <Camera className="mx-auto h-12 w-12 text-gray-400 group-hover:text-corporate-blue transition-colors" />
                                  <div className="flex text-sm text-gray-600">
                                      <span className="font-medium text-corporate-blue hover:text-blue-500">Télécharger des photos</span>
                                  </div>
                                  <p className="text-xs text-gray-500">Face avant, arrière, étiquette modèle (Max 10MB)</p>
                              </div>
                          </div>
                      </div>

                      {/* Section 4: Contact */}
                      <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Vos Coordonnées</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelStyle}>{t('buyback_data.form.email')}</label>
                                <input name="email" type="email" required className={inputStyle} placeholder={t('buyback_data.form.placeholders.email')} />
                            </div>
                            <div>
                                <label className={labelStyle}>{t('buyback_data.form.phone')}</label>
                                <input name="phone" type="tel" required className={inputStyle} placeholder={t('buyback_data.form.placeholders.phone')} />
                            </div>
                        </div>
                      </div>

                      <Button className="w-full py-4 text-lg shadow-lg">{t('buyback_data.form.submit')}</Button>
                      <p className="text-xs text-center text-gray-500">Une estimation provisoire vous sera envoyée sous 48h. Le prix final est validé après audit physique.</p>
                  </form>
              </div>
          </div>
      </div>
    </div>
  );
};