# Quickstart

générer les secrets avant toute chose.
faire ./scripts/secrets.sh

normalement pendant le dev on aura à le faire qu'une seule fois.
Eventuellement on aura à les regénérer s'il y a des ajouts au secrets.
Pour l'instant c'est très simple, on améliorera plus tard.

et faire un make.

# Docker
Presque tout passe par secrets. On verra plus tard si on modifie ça ou pas.
Pour l'instant dans nginx il y a une page de garde html qui a un lien vers chaque container.
A terme cette page va dégager.

Pgadmin permet d'aller consulter la base de données.
login : admin@example.com
mot de passe : admin

Portainer est une UI Docker qui permet d'examiner en détail les containers.
login : admin
mot de passe : admin123456789

Mailpit est une sorte de serveur mail qui intercepte les mails envoyés par l'app.
Je n'ai pas encore bien vu comment ça marche.

Important :
Pour l'instant les volumes docker backend et frontend sont montés sur le local.
Ca permet une mise à jour live du code développé. Pas besoin de relancer les containers pendant qu'on code.


# Makefile
Ciblage par service : Par défaut, les commandes s'appliquent à toute l'infrastructure.
Tu peux cibler un seul conteneur en ajoutant SERVICE=nom_du_service 
(ex: make logs SERVICE=backend).

Gestion intelligente du code vs config :
make restart : Suffisant si tu modifies un fichier .env ou une config globale.
(Inutile pour le code source JS/TS, géré en live-reload par Node).

make rebuild : À utiliser si tu modifies un Dockerfile ou si tu installes un nouveau package (npm install).

Nettoyage automatique :
Les commandes make down et make clean intègrent le flag -v pour détruire systématiquement les volumes (déconnexion propre et RAZ des bases de données).

make exec : Permet d'ouvrir rapidement un shell dans le conteneur ciblé
(ex: make exec SERVICE=backend).