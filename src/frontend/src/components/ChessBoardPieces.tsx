import React from "react";
import { ChessPiece } from "./ChessPiece";
import { FILES, RANKS, PIECE_TYPE_MAP } from "../constants/boardConstants";

interface ChessBoardPiecesProps
{
	board: any[];
	selected: string | null;
	onSquareClick: (square: string) => void;
}

export const ChessBoardPieces: React.FC<ChessBoardPiecesProps> = ({
	board,
	selected,
	onSquareClick,
}) =>
{
	const pieces = [];

	// Mappe chaque case du board à une position 3D
	for (let z = 0; z < 8; z++)
	{
		for (let x = 0; x < 8; x++)
		{
			const piece = board[z][x];
			if (!piece) continue;

			const file = FILES[x];
			const rank = RANKS[z];
			const square = file + rank;
			const isSelected = selected === square;
			const pieceName = PIECE_TYPE_MAP[piece.type] || "pawn";

			let pieceColor = "black";

			if (piece.color === "w")
			{
				pieceColor = "white";
			}

			pieces.push(
				<ChessPiece
					key={`${square}`}
					position={[x - 3.5, 0.1, z - 3.5]}
					type={pieceName}
					color={pieceColor}
					square={square}
					onClick={onSquareClick}
					isSelected={isSelected}
				/>
			);
		}
	}

	return <>{pieces}</>;
};