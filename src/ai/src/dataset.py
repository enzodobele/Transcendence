import chess
import torch
from torch.utils.data import IterableDataset

from parse import parse_pgn
from encode import fen_to_tensor


class ChessDataset(IterableDataset):
    def __init__(self, pgn_path, min_elo=1500, max_games=1_000_000):
        self.pgn_path  = pgn_path
        self.min_elo   = min_elo
        self.max_games = max_games

    def __iter__(self):
        for fen, uci, outcome in parse_pgn(self.pgn_path, self.min_elo, self.max_games):
            tensor     = fen_to_tensor(fen)
            from_sq    = chess.parse_square(uci[:2])
            to_sq      = chess.parse_square(uci[2:4])
            move_index = from_sq * 64 + to_sq

            yield (
                torch.FloatTensor(tensor),
                torch.tensor(move_index, dtype=torch.long),
                torch.tensor(outcome,    dtype=torch.float32),
            )
