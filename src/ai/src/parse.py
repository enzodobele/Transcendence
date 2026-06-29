import chess
import chess.pgn
import io
import zstandard

def open_pgn(filepath):
    if filepath.endswith(".zst"):
        ctx = zstandard.ZstdDecompressor()
        f_raw = open(filepath, "rb")
        stream = ctx.stream_reader(f_raw)
        return io.TextIOWrapper(stream, encoding="utf-8")
    return open(filepath, encoding="utf-8")

def parse_pgn(filepath, min_elo=1500, max_games=None):
    games_parsed = 0

    with open_pgn(filepath) as f:
        while True:
            game = chess.pgn.read_game(f)

            if game is None:
                break

            if max_games and games_parsed >= max_games:
                break

            headers = game.headers
            try:
                white_elo = int(headers.get("WhiteElo", 0))
                black_elo = int(headers.get("BlackElo", 0))
            except ValueError:
                continue

            if white_elo < min_elo or black_elo < min_elo:
                continue
            
            result = headers.get("Result", "*")
            if result not in ("1-0", "0-1", "1/2-1/2"):
                continue

            outcome = {"1-0": 1.0, "0-1": -1.0, "1/2-1/2": 0.0}[result]

            board = game.board()
            for move in game.mainline_moves():
                fen = board.fen()
                uci = move.uci()
                yield fen, uci, outcome
                board.push(move)

            games_parsed += 1

def main():
    path_dataset = "/home/edobele/projects/Transcendence/src/ai/data/lichess_db_standard_rated_2013-01.pgn"

    for fen, uci, outcome in parse_pgn(path_dataset, max_games=3):
        print(f"FEN    : {fen}")
        print(f"Coup   : {uci}")
        print(f"Résultat : {outcome}")
        print("---")

if __name__ == "__main__":
    main()