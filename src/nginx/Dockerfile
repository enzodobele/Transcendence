# Image de base
FROM nginx:alpine

# 1. Installe openssl et supprime les templates Nginx
RUN apk add --no-cache openssl && \
    rm -f /etc/nginx/conf.d/default.conf && \
    echo "✅ openssl installé et templates supprimés."

# 2. Crée le dossier pour les certificats et génère-les
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/nginx-selfsigned.key \
        -out /etc/nginx/ssl/nginx-selfsigned.crt \
        -subj "/C=FR/ST=Paris/L=Paris/O=ChessGuard/CN=localhost" && \
    echo "✅ Certificats SSL générés."

# 3. Désactive le script qui remplace la config
# RUN mv /docker-entrypoint.d/20-envsubst-on-templates.sh /docker-entrypoint.d/20-envsubst-on-templates.sh.bak && \
#     echo "✅ Script de template désactivé."

# 4. Copie la config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN echo "✅ Config Nginx copiée."

# 5. Affiche un résumé pour débogage
RUN echo "📌 Contenu de /etc/nginx/conf.d/:" && \
    ls -la /etc/nginx/conf.d/ && \
    echo "📌 Contenu de /etc/nginx/ssl/:" && \
    ls -la /etc/nginx/ssl/ && \
    echo "📌 Contenu de /docker-entrypoint.d/:" && \
    ls -la /docker-entrypoint.d/

# 6. Expose le port 443
EXPOSE 443