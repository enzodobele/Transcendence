FROM docker.io/dpage/pgadmin4:9.15.0

# Copie le script de provisionnement
COPY provision.sh /provision.sh
# RUN chmod +x /provision.sh

# Définis l'entrée par défaut
ENTRYPOINT ["/provision.sh"]