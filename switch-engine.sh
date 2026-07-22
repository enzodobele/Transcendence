#!/usr/bin/env bash
# script pour switcher l'hote entre podman et docker

# Sécurité : Vérifie que le script est lancé avec sudo
if [ "$EUID" -ne 0 ]; then
  echo "[ERREUR] Tu dois lancer ce script avec sudo : sudo $0"
  exit 1
fi

# 1. Détection : Est-ce que Docker est actif ?
if systemctl is-active --quiet docker; then
    echo "🔄 Docker est actif. Bascule automatique vers PODMAN..."
    
    systemctl stop docker.socket docker.service 2>/dev/null
    systemctl start podman.socket podman.service
    
    echo "✅ Podman est maintenant actif !"
else
    echo "🔄 Podman est actif (ou Docker est éteint). Bascule automatique vers DOCKER..."
    
    systemctl stop podman.socket podman.service 2>/dev/null
    systemctl start docker.socket docker.service
    
    echo "✅ Docker est maintenant actif !"
fi