import React from "react";
import { ChessPiece } from "./ChessPiece";
import { PIECE_TYPE_MAP } from "../constants/boardConstants";

interface PromotionDialogProps
{
	onChoose: (pieceName: string) => void;
	playerColor: 'w' | 'b';
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
	onChoose,
	playerColor,
}) =>
{
	const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];

	let colorName;

	if (playerColor === 'w')
	{
		colorName = 'while';
	}
	else
	{
		colorName = 'Black';
	}

	return (
		<div
			style={{
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				backgroundColor: "rgba(0, 0, 0, 0.8)",
				padding: "30px",
				borderRadius: "10px",
				zIndex: 1000,
				textAlign: "center",
				border: "3px solid gold"
			}}
		>
			<h2 style={{ color: "white", marginBottom: "20px" }}>
				Choisissez une pièce pour la promotion
			</h2>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(4, 1fr)",
					gap: "15px"
				}}
			>
				{promotionPieces.map((piece) =>
				{
					return (
						<button
							key={piece}
							onClick={() => onChoose(piece)}
							style={{
								padding: "10px",
								backgroundColor: "#4CAF50",
								color: "white",
								border: "none",
								borderRadius: "5px",
								cursor: "pointer",
								fontSize: "16px",
								fontWeight: "bold",
								textTransform: "capitalize",
								transition: "background-color 0.3s"
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.backgroundColor = "#45a049")
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.backgroundColor = "#4CAF50")
							}
						>
							{piece === 'queen' && '♕ Reine'}
							{piece === 'rook' && '♖ Tour'}
							{piece === 'bishop' && '♗ Fou'}
							{piece === 'knight' && '♘ Cavalier'}
						</button>
					);
				})}
			</div>
		</div>
	);
};