import React from "react";
import { Board } from "./Board";
import { PromotionDialog } from "./PromotionDialog";

interface ChessGame2DProps
{
	game: any;
	board: any;
	selected: any;
	lastMove: any;
	dragSquare: string | null;
	animatingToSquare: string | null;
	pendingPromotion: boolean;
	onSquareClick: (square: string) => void;
	onPiecePointerDown: (square: string, e: React.PointerEvent) => void;
	onResetGame: () => void;
	onPromotionChoice: (piece: string) => void;
}

export function ChessGame2D({
	game,
	board,
	selected,
	lastMove,
	dragSquare,
	animatingToSquare,
	pendingPromotion,
	onSquareClick,
	onPiecePointerDown,
	onResetGame,
	onPromotionChoice,
}: ChessGame2DProps)
{
	return (
		<div className="Board">
			<Board
				board={board}
				game={game}
				selected={selected}
				lastMove={lastMove}
				dragSquare={dragSquare}
				animatingToSquare={animatingToSquare}
				onSquareClick={onSquareClick}
				onPiecePointerDown={onPiecePointerDown}
			/>

			<button onClick={onResetGame} className="reset-board">
				Réinitialiser
			</button>

			{pendingPromotion && (
				<PromotionDialog
					onChoose={onPromotionChoice}
					playerColor={game.turn() === "w" ? "b" : "w"}
				/>
			)}
		</div>
	);
}
