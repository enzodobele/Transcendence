import os
import numpy as np
import torch
from torch.utils.data import IterableDataset


class ChessDataset(IterableDataset):
    def __init__(self, chunk_dir):
        self.chunks = sorted([
            os.path.join(chunk_dir, f)
            for f in os.listdir(chunk_dir)
            if f.endswith(".npz")
        ])

    def __iter__(self):
        for chunk_path in self.chunks:
            data = np.load(chunk_path)
            tensors  = data["tensors"]
            moves    = data["moves"]
            outcomes = data["outcomes"]
            for i in range(len(tensors)):
                yield (
                    torch.FloatTensor(tensors[i]),
                    torch.tensor(moves[i],    dtype=torch.long),
                    torch.tensor(outcomes[i], dtype=torch.float32),
                )
