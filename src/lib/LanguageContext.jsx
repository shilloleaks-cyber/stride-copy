import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const STORAGE_KEY = 'stride_language';

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

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}