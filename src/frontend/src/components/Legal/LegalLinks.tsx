import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LegalModal, type LegalTab } from "./LegalModal";
import "../../styles/Legal/LegalLinks.css";

export function LegalLinks() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<LegalTab>("privacy");

  function openTab(nextTab: LegalTab) {
    setTab(nextTab);
    setIsOpen(true);
  }

  return (
    <>
      <div className="legal-footer">
        <button type="button" className="legal-footer-link" onClick={() => openTab("privacy")}>
          {t("legal.privacy")}
        </button>
        <span className="legal-footer-separator">·</span>
        <button type="button" className="legal-footer-link" onClick={() => openTab("terms")}>
          {t("legal.terms")}
        </button>
      </div>

      <LegalModal isOpen={isOpen} initialTab={tab} onClose={() => setIsOpen(false)} />
    </>
  );
}
