
import React, { createContext, useContext, useEffect } from 'react';
import { TRANSLATIONS, Language } from '../translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => any;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Force language to French
  const language: Language = 'fr';
  const dir = 'ltr';

  useEffect(() => {
    // Update HTML attributes for consistency
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'fr';
  }, []);

  const t = (path: string) => {
    const keys = path.split('.');
    // Always look up in the French dictionary
    let current: any = TRANSLATIONS['fr'];
    for (const key of keys) {
      if (current[key] === undefined) return path;
      current = current[key];
    }
    return current;
  };

  // No-op function since translation is disabled
  const setLanguage = () => {};

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
