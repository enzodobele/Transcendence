# Vault Agent: renders the Postgres credential files.
# The postgres image cannot talk to Vault itself, so an agent sidecar
# authenticates via AppRole and writes the *_FILE targets it expects.
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
  contents    = "{{ with secret \"secret/data/chessguard/db\" }}{{ .Data.data.user }}{{ end }}"
  destination = "/vault/rendered/db_user"
  perms       = "0644"
}

template {
  contents    = "{{ with secret \"secret/data/chessguard/db\" }}{{ .Data.data.name }}{{ end }}"
  destination = "/vault/rendered/db_name"
  perms       = "0644"
}

template {
  contents    = "{{ with secret \"secret/data/chessguard/db\" }}{{ .Data.data.password }}{{ end }}"
  destination = "/vault/rendered/db_password"
  perms       = "0644"
}
