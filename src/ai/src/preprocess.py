import numpy as np
import chess
import os
from tqdm import tqdm

from parse import parse_pgn
from encode import fen_to_tensor

CHUNK_SIZE = 500_000  # positions par fichier

def preprocess(pgn_filepath, output_dir, min_elo=1500, max_games=None):
    os.makedirs(output_dir, exist_ok=True)

    tensors  = []
    moves    = []
    outcomes = []
    chunk_index = 0

    for fen, uci, outcome in tqdm(parse_pgn(pgn_filepath, min_elo, max_games), desc="Parsing PGN"):
        board_tensor = fen_to_tensor(fen)
        move         = chess.Move.from_uci(uci)
        move_index   = move.from_square * 64 + move.to_square

        tensors.append(board_tensor)
        moves.append(move_index)
        outcomes.append(outcome)

        if len(tensors) >= CHUNK_SIZE:
            save_chunk(output_dir, chunk_index, tensors, moves, outcomes)
            chunk_index += 1
            tensors, moves, outcomes = [], [], []

    if tensors:
        save_chunk(output_dir, chunk_index, tensors, moves, outcomes)

    print(f"Pré-processing terminé : {chunk_index + 1} fichier(s) dans {output_dir}")

def save_chunk(output_dir, index, tensors, moves, outcomes):
    path = os.path.join(output_dir, f"chunk_{index:04d}.npz")
    np.savez_compressed(
        path,
        tensors  = np.array(tensors,  dtype=np.float32),
        moves    = np.array(moves,    dtype=np.int32),
        outcomes = np.array(outcomes, dtype=np.float32),
    )
    print(f"Chunk {index} sauvegardé ({len(tensors)} positions) → {path}")

if __name__ == "__main__":
    pgn_path   = "/kaggle/working/lichess_db_standard_rated_2019-03.pgn.zst"
    output_dir = "/kaggle/working/preprocessed"
    preprocess(pgn_path, output_dir, min_elo=1500, max_games=1_000_000)
