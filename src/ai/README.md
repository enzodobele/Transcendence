# AI module — homemade chess engine

FastAPI microservice that plays chess by combining a neural network
(trained on Lichess games) with a minimax/alpha-beta search. It exposes
an internal HTTP API consumed by the frontend via nginx (`/ai/predict`).

## Overview

```
Frontend (useChessAI.ts)
        │  POST /ai/predict { fen }
        ▼
nginx  location /ai/  →  proxy_pass http://ai:8000/
        ▼
api.py (FastAPI, port 8000)
        │
        ├── encode.py   : FEN → 12×8×8 tensor
        ├── model.py    : ChessNet (CNN), policy + value outputs
        └── minimax     : alpha-beta search guided by the policy head
```

The service runs in its own container (`ai` in `docker-compose.yml` /
`docker-compose.prod.yml`), built from `Dockerfile` (dev) or
`Dockerfile.prod` (prod, with `curl` for the healthcheck).

## The model (`src/model.py`)

`ChessNet` is a small two-headed CNN ("policy + value network", a
simplified AlphaZero-style setup):

- **Input**: a board encoded as a `(12, 8, 8)` tensor — one boolean plane
  per piece type × color (`encode.py`, `PIECE_TO_PLANE`).
- **Body**: 3 `3×3` convolutions (12→64→64→64) with ReLU.
- **Policy head**: `Linear(64*8*8 → 4096)`, one score per possible move
  (indexed `from_square * 64 + to_square`, i.e. 64×64 combinations —
  promotions are not distinguished).
- **Value head**: `Linear(64*8*8 → 1)` + `tanh`, position evaluation
  between `-1` (Black winning) and `+1` (White winning).

Trained weights are stored in `models/model.pt` (loaded at API startup
if the file exists).

## The data pipeline

1. **`src/filter.py`** — filters the full Lichess PGN dump
   (`data/lichess_db_standard_rated_2025-12.pgn.zst`, ~29 GB) to keep
   only games where both players have Elo ≥ 1500, and writes a lighter
   `.pgn.zst` (`data/lichess_2025-12_1500elo.pgn.zst`, ~480 MB).
2. **`src/parse.py`** — reads a PGN file (raw or `.zst`) and yields, for
   each move played, a triple `(fen, uci, outcome)` where `outcome` is
   the game's final result from White's perspective
   (`1-0`→`1.0`, `0-1`→`-1.0`, draw→`0.0`). Also filters by minimum Elo.
3. **`src/preprocess.py`** — consumes `parse_pgn`, encodes each position
   with `fen_to_tensor`, and saves compressed chunks (`.npz`, 500,000
   positions each) containing `tensors`, `moves` (index `from*64+to`)
   and `outcomes`.
4. **`src/dataset.py`** — `ChessDataset`, a PyTorch `IterableDataset`
   that reads the `.npz` chunks from a directory in order and streams
   positions without loading everything into memory.
5. **`src/train.py`** — training loop: `DataLoader` over `ChessDataset`,
   combined loss `CrossEntropyLoss` (policy, target = move played) +
   `MSELoss` (value, target = `outcome`), Adam optimizer, model saved
   after every epoch. Resumes training if a `model.pt` already exists.
   Meant to run on GPU (Kaggle/Colab — see the hardcoded
   `/kaggle/working/...` paths), after which the resulting weights are
   copied into `models/model.pt`.

This pipeline (filter → parse → preprocess → train) is offline tooling,
run manually to retrain the model; it is not part of the API's runtime
path.

## The API (`api.py`)

Two FastAPI routes:

- `GET /health` → `{"status": "ok", "model_loaded": bool}`, used by the
  Docker healthcheck.
- `POST /predict` with `{"fen": "<FEN position>"}` → `{"move": "<uci>"}`.

`/predict` behavior:

1. If no legal move is available (checkmate / stalemate) → `move: null`.
2. If the model failed to load (`model.pt` missing) → a random move
   among the legal ones (degraded mode, not a blocking error).
3. Otherwise, **minimax search with alpha-beta pruning**, depth
   `DEPTH = 3`:
   - at each node, `get_top_k_moves` only expands the `TOP_K = 5`
     moves ranked highest by the network's *policy* head (drastically
     cuts the branching factor, ~35 legal moves on average in chess);
   - at leaves, `evaluate` returns either an exact score (`-1`/`+1`/`0`)
     if the game is over, or the network's *value* head output;
   - the root move with the best score (maximized for White, minimized
     for Black) is returned.

So the network acts both as a move-ordering heuristic **and** as a
static evaluation function, replacing a classic material evaluation —
which keeps the engine reasonably fast despite the cost of one PyTorch
forward pass per node.

## Files

| File | Role |
|---|---|
| `api.py` | FastAPI server, minimax/alpha-beta search |
| `src/model.py` | `ChessNet` architecture (policy+value CNN) |
| `src/encode.py` | FEN → `(12,8,8)` tensor encoding |
| `src/parse.py` | PGN reading → `(fen, uci, outcome)` triples |
| `src/filter.py` | Filtering a Lichess PGN dump by minimum Elo |
| `src/preprocess.py` | Generating the training `.npz` chunks |
| `src/dataset.py` | PyTorch `IterableDataset` over `.npz` chunks |
| `src/train.py` | Training loop (policy + value loss) |
| `models/model.pt` | Trained weights loaded by the API |
| `data/*.pgn.zst` | Lichess PGN dumps (raw + Elo≥1500 filtered) |
| `Dockerfile` | Dev image (volume-mounted, `--reload` via compose) |
| `Dockerfile.prod` | Prod image (installs `curl` for the healthcheck) |
| `requirements.txt` | `fastapi`, `uvicorn`, `torch` (CPU), `chess`, `numpy` |

## Running the service

Via Docker Compose, from the project root:

```bash
docker compose up ai
```

The service listens on internal port `8000` and is exposed to the
frontend via nginx under `/ai/`. To test the container directly in
local:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"}'
```

## Retraining the model

```bash
cd src/ai/src
python filter.py       # optional if data/lichess_2025-12_1500elo.pgn.zst already exists
python preprocess.py   # generates the .npz chunks (adjust paths, see __main__)
python train.py        # trains and saves model.pt
```

Note: the default paths in `preprocess.py` and `train.py`
(`/kaggle/working/...`) are meant for training on Kaggle/Colab (free
GPU) — adjust them if training locally. The resulting `model.pt` must
then be copied into `models/model.pt` to be used by `api.py`.

------------------------------------------------

# Module IA — moteur d'échecs maison (FR)

Microservice FastAPI qui joue aux échecs en combinant un réseau de neurones
(entraîné sur des parties Lichess) avec une recherche minimax/alpha-bêta.
Il expose une API HTTP interne consommée par le frontend via nginx
(`/ai/predict`).

## Vue d'ensemble

```
Frontend (useChessAI.ts)
        │  POST /ai/predict { fen }
        ▼
nginx  location /ai/  →  proxy_pass http://ai:8000/
        ▼
api.py (FastAPI, port 8000)
        │
        ├── encode.py   : FEN → tenseur 12×8×8
        ├── model.py    : ChessNet (CNN), sorties policy + value
        └── minimax     : recherche alpha-bêta guidée par le policy head
```

Le service tourne dans son propre conteneur (`ai` dans `docker-compose.yml`
/ `docker-compose.prod.yml`), buildé depuis `Dockerfile` (dev) ou
`Dockerfile.prod` (prod, avec `curl` pour le healthcheck).

## Le modèle (`src/model.py`)

`ChessNet` est un petit CNN à deux têtes ("policy + value network", façon
AlphaZero simplifié) :

- **Entrée** : un plateau encodé en tenseur `(12, 8, 8)` — un plan booléen
  par type de pièce × couleur (`encode.py`, `PIECE_TO_PLANE`).
- **Corps** : 3 convolutions `3×3` (12→64→64→64) avec ReLU.
- **Tête policy** : `Linear(64*8*8 → 4096)`, un score par coup possible
  (indexé `from_square * 64 + to_square`, soit 64×64 combinaisons —
  les promotions ne sont pas distinguées).
- **Tête value** : `Linear(64*8*8 → 1)` + `tanh`, évaluation de la position
  entre `-1` (Noirs gagnants) et `+1` (Blancs gagnants).

Poids entraînés stockés dans `models/model.pt` (chargés au démarrage de
l'API si le fichier existe).

## Le pipeline de données

1. **`src/filter.py`** — filtre le dump PGN complet de Lichess
   (`data/lichess_db_standard_rated_2025-12.pgn.zst`, ~29 Go) pour ne
   garder que les parties où les deux joueurs ont un Elo ≥ 1500, et
   réécrit un `.pgn.zst` plus léger
   (`data/lichess_2025-12_1500elo.pgn.zst`, ~480 Mo).
2. **`src/parse.py`** — lit un fichier PGN (brut ou `.zst`) et génère, pour
   chaque coup joué, un triplet `(fen, uci, outcome)` où `outcome` est le
   résultat final de la partie du point de vue des Blancs
   (`1-0`→`1.0`, `0-1`→`-1.0`, nulle→`0.0`). Filtre aussi par Elo minimum.
3. **`src/preprocess.py`** — consomme `parse_pgn`, encode chaque position
   avec `fen_to_tensor`, et sauvegarde des chunks compressés
   (`.npz`, 500 000 positions chacun) contenant `tensors`, `moves`
   (index `from*64+to`) et `outcomes`.
4. **`src/dataset.py`** — `ChessDataset`, un `IterableDataset` PyTorch qui
   relit les chunks `.npz` d'un dossier dans l'ordre et streame les
   positions sans tout charger en mémoire.
5. **`src/train.py`** — boucle d'entraînement : `DataLoader` sur
   `ChessDataset`, perte combinée `CrossEntropyLoss` (policy, cible =
   coup joué) + `MSELoss` (value, cible = `outcome`), optimiseur Adam,
   sauvegarde du modèle après chaque epoch. Reprend l'entraînement si un
   `model.pt` existe déjà. Prévu pour tourner sur GPU (Kaggle/Colab —
   voir les chemins `/kaggle/working/...` codés en dur) puis le poids
   résultant est copié dans `models/model.pt`.

Ce pipeline (filter → parse → preprocess → train) est un outillage
offline, à relancer manuellement pour ré-entraîner le modèle ; il ne fait
pas partie du chemin d'exécution de l'API.

## L'API (`api.py`)

Deux routes FastAPI :

- `GET /health` → `{"status": "ok", "model_loaded": bool}`, utilisé par
  le healthcheck Docker.
- `POST /predict` avec `{"fen": "<position FEN>"}` → `{"move": "<uci>"}`.

Comportement de `/predict` :

1. Si aucun coup légal n'est disponible (échec et mat / pat) → `move: null`.
2. Si le modèle n'a pas pu être chargé (`model.pt` absent) → coup
   aléatoire parmi les coups légaux (mode dégradé, pas d'erreur bloquante).
3. Sinon, recherche **minimax avec élagage alpha-bêta**, profondeur
   `DEPTH = 3` :
   - à chaque nœud, `get_top_k_moves` ne développe que les `TOP_K = 5`
     coups les mieux notés par la tête *policy* du réseau (réduit
     drastiquement le facteur de branchement, ~35 coups légaux en moyenne
     aux échecs) ;
   - aux feuilles, `evaluate` retourne soit un score exact
     (`-1`/`+1`/`0`) si la partie est terminée, soit la sortie de la tête
     *value* du réseau ;
   - le coup racine avec le meilleur score (maximisé pour les Blancs,
     minimisé pour les Noirs) est renvoyé.

Le réseau agit donc comme heuristique de tri de coups **et** comme
fonction d'évaluation statique, à la place d'une évaluation matérielle
classique — c'est ce qui rend le moteur relativement rapide malgré le
coût d'un forward pass PyTorch par nœud.

## Fichiers

| Fichier | Rôle |
|---|---|
| `api.py` | Serveur FastAPI, recherche minimax/alpha-bêta |
| `src/model.py` | Architecture `ChessNet` (CNN policy+value) |
| `src/encode.py` | Encodage FEN → tenseur `(12,8,8)` |
| `src/parse.py` | Lecture PGN → triplets `(fen, uci, outcome)` |
| `src/filter.py` | Filtrage d'un dump PGN Lichess par Elo minimum |
| `src/preprocess.py` | Génération des chunks `.npz` d'entraînement |
| `src/dataset.py` | `IterableDataset` PyTorch sur les chunks `.npz` |
| `src/train.py` | Boucle d'entraînement (policy + value loss) |
| `models/model.pt` | Poids entraînés chargés par l'API |
| `data/*.pgn.zst` | Dumps PGN Lichess (brut + filtré Elo≥1500) |
| `Dockerfile` | Image de dev (montée en volume, `--reload` côté compose) |
| `Dockerfile.prod` | Image de prod (installe `curl` pour le healthcheck) |
| `requirements.txt` | `fastapi`, `uvicorn`, `torch` (CPU), `chess`, `numpy` |

## Lancer le service

Via Docker Compose, depuis la racine du projet :

```bash
docker compose up ai
```

Le service écoute sur le port interne `8000` et est exposé au frontend via
nginx sous `/ai/`. En local, pour tester directement le conteneur :

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"}'
```

## Ré-entraîner le modèle

```bash
cd src/ai/src
python filter.py       # optionnel si data/lichess_2025-12_1500elo.pgn.zst existe déjà
python preprocess.py   # génère les chunks .npz (chemins à adapter, voir __main__)
python train.py        # entraîne et sauvegarde model.pt
```

Attention : les chemins par défaut dans `preprocess.py` et `train.py`
(`/kaggle/working/...`) sont pensés pour un entraînement sur Kaggle/Colab
(GPU gratuit) — à adapter si vous entraînez en local. Le fichier
`model.pt` obtenu doit ensuite être copié dans `models/model.pt` pour être
utilisé par `api.py`.
