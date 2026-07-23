# Module tracking — ChessGuard

Status of the subject's modules, based on the actual state of the code as of 2026-07-16.

Legend: ✅ Done · 🟡 In progress / partial · ❌ Not done

---

## ✅ Major — Frontend and backend framework
- Frontend: **React 18 + Vite** (`src/frontend`)
- Backend: **Express** across all 3 services (`backend-auth`, `backend-game`, `backend-matchmaking`)

## ✅ Major — Real-time features (WebSockets)
- WebSockets (`ws`) implemented on `backend-game` (`gameSocketService.ts`, `gameRoomManager.ts`)
- Game room management in place
- 🟡 To verify: graceful disconnection handling and broadcasting efficiency (not audited in detail yet)

## ✅ Minor — ORM for the database
- **Prisma** used across all 3 backend services (`prisma/schema.prisma` + `@prisma/client`)

## ✅ Minor — Custom design system (10+ reusable components)
- Typography: `@fontsource/inter` ✅
- Icons: `lucide-react` ✅
- Formalized color palette ✅ (`styles/Colors.css` — CSS variables `--color-primary`, `--color-secondary`, light/dark variants, gradient background)
- Visual consistency of buttons enforced via shared CSS ✅ (`styles/Buttons.css`, common classes applied to all buttons)

## ❌ Minor — Multi-language support (i18n, 3 languages)
- No i18n library (i18next/react-i18next) in the frontend dependencies
- No translation folder (`locales/`)
- → module not started

## ✅ Major — Standard user management and authentication
- JWT authentication ✅ (`jsonwebtoken`, dedicated middlewares)
- Profile update ✅ (`PATCH /auth/profile` route)
- Avatar upload ✅ (`multer`, `uploads/` folder)
- Friends system ✅ (present in `backend-auth`'s `schema.prisma`)
- Profile page ✅ (`components/Profile`)
- 🟡 To verify: real-time online status display

## ✅ Major — AI Opponent
- **Stockfish** on the frontend (`useStockfish.ts`) with 5 configurable difficulty levels (skill level / depth / movetime: from near-random level 1 to strong level 5), used as the playable opponent
- Adjustable difficulty, imperfect at low levels, no overlap with the custom module (see below)

## ❌ Major — WAF/ModSecurity + HashiCorp Vault
- No ModSecurity config found in nginx
- Secrets managed as plain text files (Docker secrets: `db_password.txt`, `jwt_secret.txt`, etc.), no Vault
- → module not started

## ✅ Major — Complete web-based game
- Chess game, rules handled via `chess.js`, real-time via WebSockets, win/loss conditions native to chess

## 🟡 Major — Remote players
- Dedicated matchmaking service ✅ (`backend-matchmaking`, join/leave)
- Game rooms on `backend-game` ✅
- 🟡 To verify: reconnection logic and network latency handling (no evidence found so far)

## ✅ Major — Advanced 3D graphics
- `three.js` + `@react-three/fiber` + `@react-three/drei` in the frontend (chessboard likely rendered in 3D)

## ✅ Major — Backend as microservices
- Separate services in `docker-compose.yml`: `frontend`, `nginx`, `backend-auth`, `backend-game`, `backend-matchmaking`, `ai`, `db`
- REST communication between services (e.g. `axios` in `backend-matchmaking`)
- Each service has its own database/Prisma schema

## ✅ Major — Custom module: neural network chess engine (ChessNet)
- Dedicated Python microservice (`src/ai`): custom neural network (**ChessNet**, PyTorch) trained from scratch on real Lichess games (`train.py`, `dataset.py`, `parse.py`, `encode.py`)
- Minimax search with alpha-beta pruning, guided by the model's top candidate moves (limited depth and top-k)
- Exposed via FastAPI (`api.py`, `/predict` endpoint), deployed as a separate service in `docker-compose.yml`

**Justification (to reuse in the main README):**
- **Why this module**: rather than relying solely on an external engine (Stockfish, already used for the Training mode), building a position-evaluation model trained on real data demonstrates an end-to-end understanding of an ML pipeline (game collection/parsing, board encoding, training, production inference).
- **Technical challenges addressed**: parsing and cleaning large-scale PGN games (`parse.py`, `filter.py`), FEN → tensor encoding (`encode.py`), designing and training a policy/value network (`model.py`, `train.py`), then integrating its predictions into a minimax search with alpha-beta pruning to keep it playable in real time.
- **Value added**: an opponent whose playing style is directly shaped by real human games rather than a hand-crafted evaluation function, deployed as an independent microservice that can be isolated/scaled separately from the rest of the backend.
- **Why Major**: a complete ML pipeline (data → model → training → inference service) integrated into the microservices architecture, which goes well beyond a one-off feature.

---

**Quick summary**: 9 modules done, 3 in progress/partial, 2 not started (i18n, WAF+Vault).
