import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { SUPPORTED_LANGUAGES, setLanguage, type Language } from "../../i18n";
import "../../styles/LanguageSwitcher/LanguageSwitcher.css";

const LABELS: Record<Language, string> = {
  fr: "FR",
  en: "EN",
  tr: "TR",
};

const BUBBLE_POSITION: Record<Language, "bottom-left" | "bottom" | "bottom-right"> = {
  fr: "bottom-left",
  en: "bottom",
  tr: "bottom-right",
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const active = i18n.language as Language;
  const [isOpen, setIsOpen] = useState(false);

  function handleSelect(lang: Language) {
    setLanguage(lang);
    setIsOpen(false);
  }

  return (
    <div className={`language-fab${isOpen ? " is-open" : ""}`} role="group" aria-label="Language">
      <button
        type="button"
        className="language-fab-toggle"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-label="Changer de langue"
      >
        <Languages size={18} />
      </button>

      {SUPPORTED_LANGUAGES.map((lang, i) => (
        <button
          key={lang}
          type="button"
          className={`language-bubble language-bubble--${BUBBLE_POSITION[lang]}${active === lang ? " is-active" : ""}`}
          style={{ transitionDelay: isOpen ? `${i * 45}ms` : "0ms" }}
          aria-pressed={active === lang}
          onClick={() => handleSelect(lang)}
        >
          {LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
