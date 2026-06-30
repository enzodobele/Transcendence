import torch
import torch.nn as nn
import os
from torch.utils.data import DataLoader
from tqdm import tqdm

from model import ChessNet
from dataset import ChessDataset

CHUNK_DIR  = "/kaggle/working/preprocessed"
MODEL_PATH = "/kaggle/working/model.pt"


def train(epochs=3, batch_size=256, lr=0.001):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Entrainement sur : {device}")

    model = ChessNet().to(device)

    if os.path.exists(MODEL_PATH):
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        print("Modèle chargé, on continue l'entraînement !")

    optimizer      = torch.optim.Adam(model.parameters(), lr=lr)
    policy_loss_fn = nn.CrossEntropyLoss()
    value_loss_fn  = nn.MSELoss()

    dataset = ChessDataset(CHUNK_DIR)
    loader  = DataLoader(dataset, batch_size=batch_size, num_workers=2)

    for epoch in range(epochs):
        total_loss    = 0
        total_batches = 0

        for tensors, move_indices, outcomes in tqdm(loader, desc=f"Epoch {epoch+1}"):
            tensors      = tensors.to(device)
            move_indices = move_indices.to(device)
            outcomes     = outcomes.to(device)

            policy_pred, value_pred = model(tensors)

            p_loss = policy_loss_fn(policy_pred, move_indices)
            v_loss = value_loss_fn(value_pred.squeeze(), outcomes)
            loss   = p_loss + v_loss

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss    += loss.item()
            total_batches += 1

        print(f"Epoch {epoch+1} — loss: {total_loss / total_batches:.4f}")
        torch.save(model.state_dict(), MODEL_PATH)
        print(f"Modèle sauvegardé → {MODEL_PATH}")


if __name__ == "__main__":
    train(epochs=3)
