import chess
import numpy as np

PIECE_TO_PLANE = {
    (chess.PAWN,   chess.WHITE): 0,
    (chess.KNIGHT, chess.WHITE): 1,
    (chess.BISHOP, chess.WHITE): 2,
    (chess.ROOK,   chess.WHITE): 3,
    (chess.QUEEN,  chess.WHITE): 4,
    (chess.KING,   chess.WHITE): 5,
    (chess.PAWN,   chess.BLACK): 6,
    (chess.KNIGHT, chess.BLACK): 7,
    (chess.BISHOP, chess.BLACK): 8,
    (chess.ROOK,   chess.BLACK): 9,
    (chess.QUEEN,  chess.BLACK): 10,
    (chess.KING,   chess.BLACK): 11,
}

def fen_to_tensor(fen):
    board = chess.Board(fen)
    planes = np.zeros((12, 8, 8), dtype=np.float32)

    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece is None:
            continue
        plane = PIECE_TO_PLANE[(piece.piece_type, piece.color)]
        row = 7 - (square // 8)
        col = square % 8
        planes[plane][row][col] = 1.0

    return planes

if __name__ == "__main__":
    fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"
    tensor = fen_to_tensor(fen)
    print("Shape :", tensor.shape)
    print("Plan pions blancs (plan 0) :")
    print(tensor[0])