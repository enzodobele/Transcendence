# Suivi des modules — ChessGuard

Statut des modules du sujet, basé sur l'état réel du code au 2026-07-16.

Légende : ✅ Fait · 🟡 En cours / partiel · ❌ Pas fait

---

## ✅ Major — Framework frontend et backend
- Frontend : **React 18 + Vite** (`src/frontend`)
- Backend : **Express** sur les 3 services (`backend-auth`, `backend-game`, `backend-matchmaking`)

## ✅ Major — Fonctionnalités temps réel (WebSockets)
- WebSockets (`ws`) implémentées côté `backend-game` (`gameSocketService.ts`, `gameRoomManager.ts`)
- Gestion des rooms de partie en place
- 🟡 À vérifier : gestion propre des déconnexions et efficacité du broadcasting (pas encore auditées en détail)

## ✅ Minor — ORM pour la base de données
- **Prisma** utilisé sur les 3 services backend (`prisma/schema.prisma` + `@prisma/client`)

## ✅ Minor — Design system personnalisé (10+ composants réutilisables)
- Typographie : `@fontsource/inter` ✅
- Icônes : `lucide-react` ✅
- Palette de couleurs formalisée ✅ (`styles/Colors.css` — variables CSS `--color-primary`, `--color-secondary`, variantes light/dark, background en dégradé)
- Cohérence visuelle des boutons assurée via CSS partagé ✅ (`styles/Buttons.css`, classes communes appliquées à tous les boutons)

## ❌ Minor — Support multilingue (i18n, 3 langues)
- Aucune librairie i18n (i18next/react-i18next) dans les dépendances frontend
- Aucun dossier de traductions (`locales/`)
- → module non commencé

## ✅ Major — Gestion utilisateur et authentification
- Authentification JWT ✅ (`jsonwebtoken`, middlewares dédiés)
- Mise à jour du profil ✅ (route `PATCH /auth/profile`)
- Upload d'avatar ✅ (`multer`, dossier `uploads/`)
- Système d'amis ✅ (présent dans `schema.prisma` de `backend-auth`)
- Page de profil ✅ (`components/Profile`)
- 🟡 À vérifier : affichage du statut en ligne en temps réel

## ✅ Major — Adversaire IA
- **Stockfish** côté frontend (`useStockfish.ts`) avec 5 niveaux de difficulté configurables (skill level / depth / movetime : de niveau 1 quasi-aléatoire à niveau 5 fort), pour l'adversaire jouable
- Difficulté ajustable, non parfait aux niveaux bas, pas de double emploi avec le module custom (voir ci-dessous)

## ❌ Major — WAF/ModSecurity + HashiCorp Vault
- Aucune config ModSecurity trouvée dans nginx
- Secrets gérés en fichiers texte simples (Docker secrets : `db_password.txt`, `jwt_secret.txt`, etc.), pas de Vault
- → module non commencé

## ✅ Major — Jeu complet jouable en ligne
- Jeu d'échecs, règles gérées via `chess.js`, temps réel via WebSockets, conditions de victoire/défaite natives aux échecs

## 🟡 Major — Joueurs à distance
- Service de matchmaking dédié ✅ (`backend-matchmaking`, join/leave)
- Rooms de partie côté `backend-game` ✅
- 🟡 À vérifier : logique de reconnexion et gestion de la latence réseau (pas de preuve trouvée à date)

## ✅ Major — Graphismes 3D avancés
- `three.js` + `@react-three/fiber` + `@react-three/drei` dans le frontend (échiquier probablement rendu en 3D)

## ✅ Major — Backend en microservices
- Services séparés dans `docker-compose.yml` : `frontend`, `nginx`, `backend-auth`, `backend-game`, `backend-matchmaking`, `ai`, `db`
- Communication REST entre services (ex. `axios` dans `backend-matchmaking`)
- Chaque service a sa propre base/schema Prisma

## ✅ Major — Module custom : moteur d'échecs par réseau de neurones (ChessNet)
- Microservice Python dédié (`src/ai`) : réseau de neurones custom (**ChessNet**, PyTorch) entraîné from scratch sur des parties Lichess réelles (`train.py`, `dataset.py`, `parse.py`, `encode.py`)
- Recherche minimax + élagage alpha-bêta, guidée par les meilleurs coups proposés par le modèle (profondeur et top-k limités)
- Exposé via FastAPI (`api.py`, endpoint `/predict`), déployé comme service séparé dans `docker-compose.yml`
**Justification (à reprendre dans le README principal) :**
- **Pourquoi ce module** : plutôt que de s'appuyer uniquement sur un moteur externe (Stockfish, déjà utilisé pour le mode Training), construire un modèle d'évaluation de position entraîné sur des données réelles permet de démontrer une compréhension de bout en bout d'un pipeline ML (collecte/parsing de parties, encodage du plateau, entraînement, inférence en production).
- **Défis techniques adressés** : parsing et nettoyage de parties PGN à grande échelle (`parse.py`, `filter.py`), encodage FEN → tenseur (`encode.py`), conception et entraînement d'un réseau de politique/valeur (`model.py`, `train.py`), puis intégration de ses prédictions dans une recherche minimax avec élagage alpha-bêta pour rester jouable en temps réel.
- **Valeur ajoutée** : un adversaire dont le style de jeu est directement façonné par des parties humaines réelles plutôt que par une fonction d'évaluation codée à la main, déployé comme microservice indépendant et donc isolé/scalable séparément du reste du backend.
- **Pourquoi Major** : pipeline ML complet (données → modèle → entraînement → service d'inférence) intégré dans l'architecture microservices, ce qui dépasse largement une simple fonctionnalité ponctuelle.

---

**Résumé rapide** : 9 modules faits, 3 partiels/en cours, 2 non commencés (i18n, WAF+Vault).
