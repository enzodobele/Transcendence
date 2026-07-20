import { useState } from "react";
import { LegalModal, type LegalTab } from "./LegalModal";
import "../../styles/Legal/LegalLinks.css";

export function LegalLinks() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<LegalTab>("privacy");

  function openTab(t: LegalTab) {
    setTab(t);
    setIsOpen(true);
  }

  return (
    <>
      <div className="legal-footer">
        <button type="button" className="legal-footer-link" onClick={() => openTab("privacy")}>
          Confidentialité
        </button>
        <span className="legal-footer-separator">·</span>
        <button type="button" className="legal-footer-link" onClick={() => openTab("terms")}>
          CGU
        </button>
      </div>

      <LegalModal isOpen={isOpen} initialTab={tab} onClose={() => setIsOpen(false)} />
    </>
  );
}
