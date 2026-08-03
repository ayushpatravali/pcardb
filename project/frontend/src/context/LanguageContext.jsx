import React, { createContext, useContext, useState } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Default English; persisted so a page refresh keeps the operator's choice
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

    const toggleLanguage = () => {
        setLanguage(prev => {
            const next = prev === 'en' ? 'kn' : 'en';
            localStorage.setItem('language', next);
            return next;
        });
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
