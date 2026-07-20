# Spectator Mode

Ce document récapitule exactement ce qui a été modifié pour la feature Spectator Mode.

## 1) Objectif de la feature

Permettre à un utilisateur d'observer une partie en cours en temps réel, sans pouvoir jouer de coups.

Le mode spectateur inclut:
- réception en direct des coups via WebSocket
- affichage du plateau en lecture seule
- accès depuis la liste d'amis quand un ami est en partie
- interdiction pour un joueur déjà engagé dans une partie de spectate sa propre game
- indication visuelle sur la page spectateur de la couleur jouée par l'ami observé

## 2) Fichiers modifiés pour cette feature

### Backend game (WebSocket / diffusion spectateur)
- `src/backend-game/src/services/game/types.ts`
  - ajout du support des spectateurs dans la room
- `src/backend-game/src/services/game/gameRoomManager.ts`
  - gestion des connexions spectateurs
  - retrait des spectateurs à la fermeture
  - diffusion des événements aux spectateurs
- `src/backend-game/src/services/game/handlers/authHandler.ts`
  - validation du mode spectateur
  - blocage d'un joueur actif qui tente de spectate sa propre partie
- `src/backend-game/src/services/game/handlers/moveHandler.ts`
  - diffusion des coups vers les spectateurs
- `src/backend-game/src/services/game/handlers/actionHandler.ts`
  - diffusion abandon / nulle / fin de partie vers les spectateurs
- `src/backend-game/src/services/game/gameDbService.ts`
  - chargement des pseudos des deux joueurs pour le mode spectateur
- `src/backend-game/src/services/game/gameSocketService.ts`
  - branchement complet du flux spectateur WebSocket
  - envoi du sync initial avec FEN, historique et noms des joueurs

### Frontend (page spectateur)
- `src/frontend/src/main.tsx`
  - routage simple vers `/spectate`
- `src/frontend/src/components/SpectatorPage.tsx`
  - page spectateur
  - plateau en lecture seule
  - bouton quitter le mode spectateur
  - affichage de la couleur des joueurs observés
  - indication spéciale quand un des joueurs observés est un ami
- `src/frontend/src/hooks/chess/useSpectatorWebSocket.ts`
  - connexion WebSocket spectateur
  - réception du sync initial et des coups suivants
- `src/frontend/src/components/Board/GameView.tsx`
  - mode lecture seule quand `isSpectator`
- `src/frontend/src/components/Profile/ProfileOverlay.tsx`
  - bouton `Spectate` dans la liste d'amis
  - visible seulement si l'ami est en partie
  - masqué si l'utilisateur courant est déjà lui-même dans une partie
- `src/frontend/src/services/auth.ts`
  - type `getFriends()` élargi pour récupérer `currentGameId`

### Backend friends
- `src/backend-friends/prisma/schema.prisma`
  - exposition du `currentGameId` utilisateur côté service friends
- `src/backend-friends/src/controllers/friendController.ts`
  - retour de `currentGameId` dans la liste d'amis

## 3) Comment ça fonctionne

### A. Détection d'un ami en partie
Quand l'utilisateur ouvre son profil:
- le frontend appelle `/api/friends`
- chaque ami renvoyé contient désormais `currentGameId`
- si `currentGameId` existe et que l'utilisateur courant n'est pas déjà en partie:
  - le bouton `Spectate` apparaît

### B. Accès au mode spectateur
Quand l'utilisateur clique sur `Spectate`:
- le frontend ouvre `/spectate?gameId=<id>`
- la page spectateur ouvre ensuite un WebSocket vers:

```text
/ws?spectator=1&gameId=<id>
```

### C. Sync initial
À la connexion du spectateur, le backend envoie:
- la position FEN actuelle
- l'historique des coups
- le pseudo du joueur blanc
- le pseudo du joueur noir

### D. Réception des événements en direct
Le spectateur reçoit ensuite:
- les coups joués
- la fin de partie
- les événements de partie diffusés aux joueurs

### E. Lecture seule stricte
Le spectateur ne peut pas:
- déplacer les pièces
- capturer localement
- jouer un coup
- modifier la partie côté client

## 4) Indication des couleurs sur la page spectateur

La page spectateur affiche désormais:
- si les deux joueurs observés sont des amis:
  - `<Pseudo_joueur> joue les blancs (ami)`
  - `<Pseudo_joueur> joue les noirs (ami)`
- si un seul des deux joueurs est un ami:
  - `Votre ami <Pseudo_joueur> joue les blancs.`
  - ou `Votre ami <Pseudo_joueur> joue les noirs.`

Cela permet au spectateur de comprendre immédiatement quelle couleur joue son ami.

## 5) Démo orale jury (script prêt à l'emploi)

Durée cible: 2 à 4 minutes.

### Étape A - Contexte (20s)
Dire:
- "J'ai ajouté un mode spectateur temps réel basé sur notre WebSocket existant, sans chat, avec une interface en lecture seule."

### Étape B - Détection dans la liste d'amis (30s)
Montrer:
- ouvrir le profil
- afficher la liste d'amis
- montrer qu'un ami actuellement en partie a un bouton `Spectate`

Dire:
- "Le bouton n'apparaît que si l'ami a une partie en cours."

### Étape C - Ouverture du mode spectateur (30s)
Montrer:
- cliquer sur `Spectate`
- arriver sur la page spectateur

Dire:
- "Le spectateur rejoint la partie en lecture seule via WebSocket."

### Étape D - Couleurs des joueurs (25s)
Montrer:
- le bloc d'information en haut à gauche
- la couleur jouée par l'ami observé

Dire:
- "J'affiche explicitement si l'ami joue les blancs ou les noirs, ce qui rend la lecture immédiate."

### Étape E - Temps réel (35s)
Montrer:
- faire jouer un coup par un vrai joueur
- montrer que le spectateur reçoit la mise à jour en direct

Dire:
- "Le spectateur reçoit le sync initial puis tous les coups suivants en temps réel."

### Étape F - Lecture seule et sécurité (35s)
Montrer:
- essayer de déplacer une pièce côté spectateur
- constater que rien ne bouge
- montrer le bouton quitter le mode spectateur

Dire:
- "Le spectateur ne peut pas interagir avec la partie."
- "Un joueur déjà engagé dans une partie ne peut pas se spectate lui-même."
