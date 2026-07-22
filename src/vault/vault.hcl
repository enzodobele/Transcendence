# Vault server config: production mode (starts sealed) with file storage.
# disable_mlock is the documented setting for containerized/rootless runs.
ui            = true
disable_mlock = true

storage "file" {
  path = "/vault/file"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  # No TLS inside the isolated compose network (accepted scope trade-off).
  tls_disable = 1
}
