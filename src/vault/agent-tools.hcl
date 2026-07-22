# Vault Agent: renders admin-tool password files (dev-only stack).
pid_file = "/tmp/vault-agent.pid"

vault {
  address = "http://vault:8200"
}

auto_auth {
  method "approle" {
    config = {
      role_id_file_path                   = "/vault/creds/role_id"
      secret_id_file_path                 = "/vault/creds/secret_id"
      remove_secret_id_file_after_reading = false
    }
  }
  sink "file" {
    config = { path = "/tmp/vault-token" }
  }
}

template {
  contents    = "{{ with secret \"secret/data/chessguard/portainer\" }}{{ .Data.data.password }}{{ end }}"
  destination = "/vault/rendered/portainer_password"
  perms       = "0644"
}

template {
  contents    = "{{ with secret \"secret/data/chessguard/pgadmin\" }}{{ .Data.data.password }}{{ end }}"
  destination = "/vault/rendered/pgadmin_password"
  perms       = "0644"
}
