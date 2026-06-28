import torch
from torch.utils.data import IterableDataset
import numpy as np
import glob
import random

class ChessDataset(IterableDataset):
    def __init__(self, preprocessed_dir):
        self.chunk_files = sorted(glob.glob(f"{preprocessed_dir}/chunk_*.npz"))

        if not self.chunk_files:
            raise FileNotFoundError(f"Aucun chunk trouvé dans {preprocessed_dir}")

        print(f"{len(self.chunk_files)} chunk(s) trouvé(s)")

    def __iter__(self):
        chunk_files = self.chunk_files.copy()
        random.shuffle(chunk_files)

        for chunk_path in chunk_files:
            data     = np.load(chunk_path)
            tensors  = data["tensors"]
            moves    = data["moves"]
            outcomes = data["outcomes"]

            indices = np.random.permutation(len(tensors))

            for i in indices:
                yield (
                    torch.FloatTensor(tensors[i]),
                    torch.tensor(moves[i], dtype=torch.long),
                    torch.tensor(outcomes[i], dtype=torch.float32),
                )