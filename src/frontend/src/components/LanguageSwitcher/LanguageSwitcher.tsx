import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, setLanguage, type Language } from "../../i18n";
import "../../styles/LanguageSwitcher/LanguageSwitcher.css";

const LABELS: Record<Language, string> = {
  fr: "FR",
  en: "EN",
  tr: "TR",
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const active = i18n.language as Language;

  return (
    <div className="language-switcher" role="group" aria-label="Language">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          className={`language-switcher__btn${active === lang ? " is-active" : ""}`}
          aria-pressed={active === lang}
          onClick={() => setLanguage(lang)}
        >
          {LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
