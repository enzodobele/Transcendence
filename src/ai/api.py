import os
import sys
import random
import chess
import torch
from fastapi import FastAPI
from pydantic import BaseModel

sys.path.append("/app/src")
from model import ChessNet
from encode import fen_to_tensor

MODEL_PATH = "/app/models/model.pt"

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


@app.post("/predict")
def predict(req: PredictRequest):
    board = chess.Board(req.fen)
    legal_moves = list(board.legal_moves)

    if not legal_moves:
        return {"move": None}

    if not model_loaded:
        return {"move": random.choice(legal_moves).uci()}

    tensor = fen_to_tensor(req.fen)
    tensor = torch.FloatTensor(tensor).unsqueeze(0).to(device)

    with torch.no_grad():
        policy, _ = model(tensor)
        policy = policy.squeeze(0).cpu().numpy()

    best_move = max(
        legal_moves,
        key=lambda m: policy[m.from_square * 64 + m.to_square]
    )

    return {"move": best_move.uci()}

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model_loaded}