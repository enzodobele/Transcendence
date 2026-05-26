FROM node:18-alpine

# 1. Crée le dossier cible à la racine pendant le build (en tant que root)
# et donne les droits totaux d'écriture
RUN mkdir -p /target_dist && chmod 777 /target_dist

# Crée un utilisateur non-root pour la sécurité du build
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

# Copie les fichiers et donne les droits
COPY --chown=nodejs:nodejs . .

RUN npm install
RUN npm run build

# On reste en root pour la commande finale
USER root

# On copie uniquement le CONTENU (le .) pour ne pas écraser les permissions du dossier parent
CMD ["sh", "-c", "cp -Rp /app/dist/. /target_dist/ && echo 'Build copié !' && tail -f /dev/null"]