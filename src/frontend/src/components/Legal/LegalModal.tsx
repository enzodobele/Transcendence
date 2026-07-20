import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/Legal/LegalModal.css";

export type LegalTab = "privacy" | "terms";

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export function LegalModal({ isOpen, initialTab = "privacy", onClose }: LegalModalProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      className="legal-overlay"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
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
          <LegalDocument doc={tab === "privacy" ? "privacyDoc" : "termsDoc"} />
        </div>
      </div>
    </div>
  );
}

function LegalDocument({ doc }: { doc: "privacyDoc" | "termsDoc" }) {
  const { t } = useTranslation();
  const sections = t(`legal.${doc}.sections`, { returnObjects: true }) as unknown as LegalSection[];

  return (
    <>
      <h2 className="legal-title">{t(`legal.${doc}.title`)}</h2>
      <p className="legal-updated">{t(`legal.${doc}.updated`)}</p>
      {sections.map((section, i) => (
        <Fragment key={i}>
          <h3>{section.heading}</h3>
          {section.paragraphs?.map((paragraph, j) => (
            <p key={j}>{paragraph}</p>
          ))}
          {section.list && (
            <ul>
              {section.list.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )}
        </Fragment>
      ))}
    </>
  );
}
