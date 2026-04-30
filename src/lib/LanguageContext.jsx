import React, { createContext, useContext, useState, useCallback } from 'react';
import { translate } from './i18n';

const LanguageContext = createContext();

const STORAGE_KEY = 'boomx_language';

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'th', label: 'Thai', native: 'ไทย' },
];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'en'; } catch { return 'en'; }
  });

  const setLanguage = (code) => {
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
    setLanguageState(code);
  };

  const t = useCallback((key) => translate(language, key), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}