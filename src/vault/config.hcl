# =========================================================================
# 🔐 Configuration du serveur Vault (Production)
# =========================================================================

# Stockage des secrets : backend "fichier", CHIFFRÉ par Vault, sur un volume persistant.
storage "file" {
  path = "/vault/file"
}

# Point d'écoute de l'API Vault (réseau interne Docker uniquement).
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1          # pas de TLS ici : le trafic reste sur le réseau Docker isolé
}

# Adresse par laquelle Vault se référence lui-même.
api_addr = "http://vault:8200"

# Interface web (utile pour la démo de soutenance).
ui = true