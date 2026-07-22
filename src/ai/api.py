import os
import sys
import random
import chess
import torch
from fastapi import FastAPI, Response, status
from pydantic import BaseModel

sys.path.append("/app/src")
from model import ChessNet
from encode import fen_to_tensor

MODEL_PATH = "/app/models/model.pt"
DEPTH = 3
TOP_K = 5

app = FastAPI()
device = torch.device("cpu")
model = ChessNet().to(device)
model_loaded = False

if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()
    model_loaded = True
    print(f"Modèle chargé depuis {MODEL_PATH}")
else:
    print("Modèle non trouvé — coups aléatoires jusqu'au chargement")


class PredictRequest(BaseModel):
    fen: str


def get_top_k_moves(board: chess.Board, k: int):
    tensor = torch.FloatTensor(fen_to_tensor(board.fen())).unsqueeze(0).to(device)
    with torch.no_grad():
        policy, _ = model(tensor)
        policy = policy.squeeze(0).cpu().numpy()
    legal = list(board.legal_moves)
    legal.sort(key=lambda m: policy[m.from_square * 64 + m.to_square], reverse=True)
    return legal[:k]


def evaluate(board: chess.Board) -> float:
    if board.is_checkmate():
        return -1.0 if board.turn == chess.WHITE else 1.0
    if board.is_game_over():
        return 0.0
    tensor = torch.FloatTensor(fen_to_tensor(board.fen())).unsqueeze(0).to(device)
    with torch.no_grad():
        _, value = model(tensor)
    return value.item()


def minimax(board: chess.Board, depth: int, alpha: float, beta: float, maximizing: bool) -> float:
    if depth == 0 or board.is_game_over():
        return evaluate(board)

    moves = get_top_k_moves(board, TOP_K)

    if maximizing:
        best = float("-inf")
        for move in moves:
            board.push(move)
            best = max(best, minimax(board, depth - 1, alpha, beta, False))
            board.pop()
            alpha = max(alpha, best)
            if beta <= alpha:
                break
        return best
    else:
        best = float("inf")
        for move in moves:
            board.push(move)
            best = min(best, minimax(board, depth - 1, alpha, beta, True))
            board.pop()
            beta = min(beta, best)
            if beta <= alpha:
                break
        return best


@app.post("/predict")
def predict(req: PredictRequest):
    board = chess.Board(req.fen)
    legal_moves = list(board.legal_moves)

    if not legal_moves:
        return {"move": None}

    if not model_loaded:
        return {"move": random.choice(legal_moves).uci()}

    maximizing = board.turn == chess.WHITE
    best_move = None
    best_score = float("-inf") if maximizing else float("inf")
    alpha = float("-inf")
    beta = float("inf")

    for move in get_top_k_moves(board, TOP_K):
        board.push(move)
        score = minimax(board, DEPTH - 1, alpha, beta, not maximizing)
        board.pop()

        if maximizing and score > best_score:
            best_score = score
            best_move = move
            alpha = max(alpha, score)
        elif not maximizing and score < best_score:
            best_score = score
            best_move = move
            beta = min(beta, score)

    return {"move": best_move.uci() if best_move else legal_moves[0].uci()}


@app.get("/health")
def health(response: Response):
    if not model_loaded:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "loading", "model_loaded": False}
        
    return {"status": "ok", "model_loaded": True}