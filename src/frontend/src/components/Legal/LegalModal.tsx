import { useState } from "react";
import "../../styles/Legal/LegalModal.css";

export type LegalTab = "privacy" | "terms";

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export function LegalModal({ isOpen, initialTab = "privacy", onClose }: LegalModalProps) {
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
        <button type="button" onClick={onClose} className="legal-close-button" aria-label="Fermer">
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
            Politique de confidentialité
          </button>
          <button
            type="button"
            className={`legal-tab${tab === "terms" ? " legal-tab-active" : ""}`}
            onClick={() => setTab("terms")}
          >
            Conditions d'utilisation
          </button>
        </div>

        <div className="legal-body">
          {tab === "privacy" ? <PrivacyPolicyContent /> : <TermsOfServiceContent />}
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicyContent() {
  return (
    <>
      <h2 className="legal-title">Politique de confidentialité</h2>
      <p className="legal-updated">Dernière mise à jour : Juillet 2026</p>

      <h3>1. Qui sommes-nous</h3>
      <p>
        ChessGuard est un jeu d'échecs en ligne développé dans le cadre du cursus 42.
        Cette page décrit quelles données sont collectées lorsque vous utilisez
        l'application et pour quelles raisons.
      </p>

      <h3>2. Données collectées</h3>
      <ul>
        <li>Votre adresse email et votre pseudo, fournis lors de l'inscription.</li>
        <li>Votre mot de passe, stocké sous forme hachée et salée (jamais en clair).</li>
        <li>
          L'historique de vos parties (coups joués, résultats, adversaires) nécessaire
          au fonctionnement du jeu et aux statistiques de votre profil.
        </li>
        <li>Un jeton de session (token) conservé localement dans votre navigateur pour rester connecté.</li>
      </ul>

      <h3>3. Utilisation des données</h3>
      <p>
        Ces données servent uniquement à faire fonctionner le service : authentification,
        mise en relation entre joueurs, sauvegarde de vos parties et affichage de votre
        profil. Elles ne sont ni vendues, ni partagées avec des tiers, ni utilisées à
        des fins publicitaires.
      </p>

      <h3>4. Conservation</h3>
      <p>
        Vos données sont conservées tant que votre compte existe. Vous pouvez demander
        leur suppression à tout moment en supprimant votre compte ou en contactant
        l'équipe du projet.
      </p>

      <h3>5. Vos droits</h3>
      <p>
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de
        suppression de vos données personnelles. Pour exercer ce droit, contactez
        l'équipe via le dépôt GitHub du projet.
      </p>

      <h3>6. Cookies et stockage local</h3>
      <p>
        L'application utilise le stockage local du navigateur (localStorage) pour
        conserver votre jeton de connexion. Aucun cookie de tracking ou publicitaire
        n'est utilisé.
      </p>
    </>
  );
}

function TermsOfServiceContent() {
  return (
    <>
      <h2 className="legal-title">Conditions d'utilisation</h2>
      <p className="legal-updated">Dernière mise à jour : Juillet 2026</p>

      <h3>1. Objet</h3>
      <p>
        Les présentes conditions régissent l'utilisation de ChessGuard, une plateforme
        de jeu d'échecs en ligne. En créant un compte, vous acceptez ces conditions
        dans leur intégralité.
      </p>

      <h3>2. Création de compte</h3>
      <p>
        Vous devez fournir un email valide et un pseudo. Vous êtes responsable de la
        confidentialité de votre mot de passe et de toute activité effectuée depuis
        votre compte.
      </p>

      <h3>3. Bonne conduite</h3>
      <ul>
        <li>Le fair-play est requis : l'utilisation d'outils d'aide externes pendant une partie en ligne est interdite.</li>
        <li>Les pseudos et messages injurieux, discriminatoires ou illégaux ne sont pas tolérés.</li>
        <li>Toute tentative de contournement de la sécurité de la plateforme entraîne la suspension du compte.</li>
      </ul>

      <h3>4. Fonctionnalités du jeu</h3>
      <p>
        La plateforme propose des parties en local, en ligne et contre une intelligence
        artificielle. Les résultats et statistiques affichés reflètent les parties
        réellement jouées sur la plateforme.
      </p>

      <h3>5. Disponibilité du service</h3>
      <p>
        ChessGuard est un projet étudiant fourni "tel quel", sans garantie de
        disponibilité continue. Le service peut être interrompu ou modifié à tout
        moment, notamment pour maintenance.
      </p>

      <h3>6. Suppression de compte</h3>
      <p>
        Vous pouvez demander la suppression de votre compte à tout moment. Cela
        entraîne la suppression de vos données personnelles conformément à notre
        politique de confidentialité.
      </p>

      <h3>7. Contact</h3>
      <p>
        Pour toute question relative à ces conditions, contactez l'équipe via le dépôt
        GitHub du projet.
      </p>
    </>
  );
}
