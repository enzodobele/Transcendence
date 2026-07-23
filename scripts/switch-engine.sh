#!/usr/bin/env bash
# script pour switcher l'hote entre podman et docker

# Sécurité : Vérifie que le script est lancé avec sudo
if [ "$EUID" -ne 0 ]; then
  echo "[ERREUR] Tu dois lancer ce script avec sudo : sudo $0"
  exit 1
fi

# Fonction pour isoler et tuer TOUT ce qui est lié à Docker
kill_docker_completely() {
    echo "🛑 Arrêt strict de Docker..."
    # 1. Arrêt des services et des sockets systemd
    systemctl stop docker.socket docker.service containerd.service 2>/dev/null
    
    # 2. On tue les démons résiduels s'ils font de la résistance
    pkill -9 -f "dockerd" 2>/dev/null
    pkill -9 -f "docker-proxy" 2>/dev/null
    pkill -9 -f "containerd" 2>/dev/null
    
    # 3. Nettoyage des liaisons réseaux virtuelles pour éviter les conflits
    if command -v ip &>/dev/null; then
        ip link delete docker0 2>/dev/null
    fi
}

# Fonction pour isoler et tuer TOUT ce qui est lié à Podman
kill_podman_completely() {
    echo "🛑 Arrêt strict de Podman..."
    # 1. Arrêt des services et sockets systemd
    systemctl stop podman.socket podman.service 2>/dev/null
    
    # 2. Podman est "rootless" ou utilise des démons légers (conmon, pasta, slirp4netns)
    # On nettoie tous les processus de conteneurs Podman en cours
    pkill -9 -f "podman" 2>/dev/null
    pkill -9 -f "conmon" 2>/dev/null
    pkill -9 -f "rootlessport" 2>/dev/null
}

# 1. Détection de la bascule
if systemctl is-active --quiet docker || pgrep -f "dockerd" &>/dev/null; then
    echo "🔄 Docker détecté. Nettoyage et bascule vers PODMAN..."
    
    kill_docker_completely
    
    # Activation propre de Podman
    systemctl start podman.socket podman.service
    
    echo "--------------------------------------------------------"
    echo "✅ Podman est maintenant actif et isolé !"
    echo "💡 Note : Si tu utilises des alias, pense à vérifier ton \$DOCKER_HOST"
else
    echo "🔄 Podman détecté (ou Docker éteint). Nettoyage et bascule vers DOCKER..."
    
    kill_podman_completely
    
    # Activation propre de Docker
    systemctl start containerd.service 2>/dev/null
    systemctl start docker.socket docker.service
    
    echo "--------------------------------------------------------"
    echo "✅ Docker est maintenant actif et isolé !"
fi