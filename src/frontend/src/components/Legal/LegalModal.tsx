import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "../../styles/Legal/LegalModal.css";

export type LegalTab = "privacy" | "terms";

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export function LegalModal({ isOpen, initialTab = "privacy", onClose }: LegalModalProps) {
  const [tab, setTab] = useState<LegalTab>(initialTab);
  const { t } = useTranslation();

  if (!isOpen) return null;

  return createPortal(
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="legal-close-button" aria-label={t("legal.close")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <div className="legal-tabs">
          <button
            type="button"
            className={`legal-tab${tab === "privacy" ? " legal-tab-active" : ""}`}
            onClick={() => setTab("privacy")}
          >
            {t("legal.privacyTab")}
          </button>
          <button
            type="button"
            className={`legal-tab${tab === "terms" ? " legal-tab-active" : ""}`}
            onClick={() => setTab("terms")}
          >
            {t("legal.termsTab")}
          </button>
        </div>

        <div className="legal-body">
          {tab === "privacy" ? <PrivacyPolicyContent /> : <TermsOfServiceContent />}
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ContentSectionProps {
  docKey: "privacyDoc" | "termsDoc";
}

function LegalContent({ docKey }: ContentSectionProps) {
  const { t } = useTranslation();
  const doc = t(`legal.${docKey}`, { returnObjects: true }) as any;

  if (!doc || !doc.sections) {
    return <div>Contenu non disponible</div>;
  }

  return (
    <>
      <h2 className="legal-title">{doc.title}</h2>
      <p className="legal-updated">{doc.updated}</p>

      {doc.sections.map((section: any, index: number) => (
        <div key={index}>
          <h3>{section.heading}</h3>
          {section.paragraphs && section.paragraphs.map((para: string, pIndex: number) => (
            <p key={pIndex}>{para}</p>
          ))}
          {section.list && section.list.length > 0 && (
            <ul>
              {section.list.map((item: string, lIndex: number) => (
                <li key={lIndex}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}

function PrivacyPolicyContent() {
  return <LegalContent docKey="privacyDoc" />;
}

function TermsOfServiceContent() {
  return <LegalContent docKey="termsDoc" />;
}
