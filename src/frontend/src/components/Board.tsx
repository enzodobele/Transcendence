import React from "react";
import { Square2D } from "./Square2D";
import { FILES, RANKS } from "../constants/pieces";

interface BoardProps
{
	board: any[][];
	game: any;
	selected: string | null;
	lastMove: { from: string; to: string } | null;
	dragSquare: string | null;
	animatingToSquare: string | null;
	onSquareClick: (square: string) => void;
	onPiecePointerDown: (square: string, e: React.PointerEvent) => void;
}

export const Board: React.FC<BoardProps> = ({
	board,
	game,
	selected,
	lastMove,
	dragSquare,
	animatingToSquare,
	onSquareClick,
	onPiecePointerDown,
}) =>
{
	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(8, 100px)",
				gap: 0,
				marginBottom: "20px",
			}}
		>
			{board.map((row, rowIndex) =>
				row.map((piece, colIndex) =>
				{
					const file = FILES[colIndex];
					const rank = RANKS[rowIndex];
					const square = file + rank;
					const isLight = (colIndex + rowIndex) % 2 === 0;
					const isSelected = dragSquare ? dragSquare === square : selected === square;
					const isBeingDragged = dragSquare === square;

					let possibleMoves: string[] = [];
					const sourceSquare = dragSquare ?? selected;
					if (sourceSquare)
					{
						possibleMoves = game
							.moves({ square: sourceSquare, verbose: true })
							.map((m: any) => m.to);
					}

					const isPossibleMove = possibleMoves.includes(square);
					const isCapture = isPossibleMove && piece;

					return (
						<Square2D
							key={square}
							square={square}
							piece={piece}
							isLight={isLight}
							isSelected={isSelected}
							isPossibleMove={isPossibleMove}
							isCapture={isCapture}
							isBeingDragged={isBeingDragged}
							isAnimatingTarget={animatingToSquare === square}
							lastMove={lastMove}
							onClick={onSquareClick}
							onPiecePointerDown={onPiecePointerDown}
						/>
					);
				})
			)}
		</div>
	);
};
