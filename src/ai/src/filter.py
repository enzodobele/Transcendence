import chess.pgn
import zstandard
import io
from tqdm import tqdm

INPUT  = "../data/lichess_db_standard_rated_2025-12.pgn.zst"
OUTPUT = "../data/lichess_2025-12_1500elo.pgn.zst"
MIN_ELO = 1500

def filter_pgn(input_path, output_path, min_elo):
    ctx_read  = zstandard.ZstdDecompressor()
    ctx_write = zstandard.ZstdCompressor(level=3)

    games_kept  = 0
    games_total = 0

    with open(input_path, "rb") as f_in, open(output_path, "wb") as f_out:
        stream_in  = ctx_read.stream_reader(f_in)
        stream_out = ctx_write.stream_writer(f_out)
        text_in    = io.TextIOWrapper(stream_in, encoding="utf-8")
        text_out   = io.TextIOWrapper(stream_out, encoding="utf-8", write_through=True)

        while True:
            game = chess.pgn.read_game(text_in)
            if game is None:
                break

            games_total += 1

            try:
                white_elo = int(game.headers.get("WhiteElo", 0))
                black_elo = int(game.headers.get("BlackElo", 0))
            except ValueError:
                continue

            if white_elo < min_elo or black_elo < min_elo:
                continue

            print(game, file=text_out, end="\n\n")
            games_kept += 1

            if games_total % 10000 == 0:
                print(f"{games_total} parties lues, {games_kept} gardées...")

        text_out.flush()
        stream_out.flush(zstandard.FLUSH_FRAME)

    print(f"\nTerminé : {games_kept}/{games_total} parties gardées → {output_path}")

if __name__ == "__main__":
    filter_pgn(INPUT, OUTPUT, MIN_ELO)
