# Vault - Secrets Management

HashiCorp Vault is an encrypted store that holds every sensitive credential in
ChessGuard: the database login, the JWT signing secret, and the Portainer and
pgAdmin passwords. Nothing sensitive lives in the repository or the compose
files. Each service authenticates to Vault and can read only its own paths,
so a leaked credential exposes only what that one service could already access.

## Components

| Component | Role |
|---|---|
| `vault` | The Vault server. Starts **sealed** (locked until unsealed) and is reachable at `http://vault:8200` inside the compose network. |
| `vault-bootstrap` | Runs once at startup, then exits. First run: initializes Vault, writes policies, creates one AppRole per service, and generates every secret. Every run: unseals Vault and distributes credentials. Other services wait for it to finish. |
| `vault-agent-db` | Renders the database user/name/password into files for Postgres, which cannot read from Vault directly. |
| `vault-agent-tools` (dev only) | Renders the Portainer and pgAdmin password files. |
| `.vault/<env>/init.env` | Host file, gitignored. Holds the unseal key and root token — the one file to protect. Never commit or share it. |

**AppRole** is Vault's machine login: a `role_id` (username) and `secret_id`
(password). Each service receives its own pair in a private, read-only volume
at `/vault/creds`.

## Secrets

Stored in Vault's key/value store under `secret/`:

| Path | Fields |
|---|---|
| `secret/chessguard/db` | `user`, `name`, `password` |
| `secret/chessguard/jwt` | `secret` |
| `secret/chessguard/portainer` | `password` |
| `secret/chessguard/pgadmin` | `password` |

Each reader gets only the access it needs:

| Reader | Can read |
|---|---|
| backend-auth, -friends, -game, -matchmaking, -status | `db`, `jwt` |
| `vault-agent-db` (Postgres) | `db` |
| `vault-agent-tools` (Portainer, pgAdmin) | `portainer`, `pgadmin` |

## Commands

```bash
make vault-status                    # is Vault unsealed?
make vault-unseal                    # re-unseal manually
make vault-logs                      # follow vault + vault-bootstrap logs

# Read a secret by hand (root token from the gitignored init file):
. ./.vault/dev/init.env && docker exec -e VAULT_TOKEN=$VAULT_ROOT_TOKEN \
  vault vault kv get secret/chessguard/db
```

Prod variants: `make prod-vault-status`, `make prod-vault-unseal`,
`make prod-vault-logs`. The Vault web UI is available at `http://127.0.0.1:8200`
in dev only (this port is not exposed in prod); log in with the root token.
