import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./locales/fr/translation.json";
import en from "./locales/en/translation.json";
import tr from "./locales/tr/translation.json";

export const SUPPORTED_LANGUAGES = ["fr", "en", "tr"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "fr";

const STORAGE_KEY = "lang";

function isLanguage(value: string | null): value is Language {
  return value !== null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

const initialLanguage = getInitialLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
});

document.documentElement.lang = initialLanguage;

export function setLanguage(lang: Language): void {
  void i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
}

export default i18n;
