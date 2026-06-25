import React from "react";
import { PIECE_SVG } from "../constants/pieces";

interface Square2DProps
{
	square: string;
	piece: any;
	isLight: boolean;
	isSelected: boolean;
	isPossibleMove: boolean;
	isCapture: boolean;
	isBeingDragged: boolean;
	isAnimatingTarget: boolean;
	lastMove: { from: string; to: string } | null;
	onClick: (square: string) => void;
	onPiecePointerDown: (square: string, e: React.PointerEvent) => void;
}

export const Square2D: React.FC<Square2DProps> = ({
	square,
	piece,
	isLight,
	isSelected,
	isPossibleMove,
	isCapture,
	isBeingDragged,
	isAnimatingTarget,
	lastMove,
	onClick,
	onPiecePointerDown,
}) =>
{
	let baseColor = isLight ? "#f0d9b5" : "#b58863";
	let backgroundColor = baseColor;

	if (lastMove && (lastMove.from === square || lastMove.to === square))
		backgroundColor = "#baca44";

	if (isSelected)
		backgroundColor = "#7ec850";
	else if (isPossibleMove)
		backgroundColor = isCapture ? "#e84c3d" : "#baca44";

	return (
		<div
			data-square={square}
			style={{
				width: "100px",
				height: "100px",
				backgroundColor,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				cursor: "pointer",
				position: "relative",
			}}
			onClick={() => onClick(square)}
		>
			{isPossibleMove && !isCapture && (
				<div
					style={{
						width: "12px",
						height: "12px",
						borderRadius: "50%",
						backgroundColor: "rgba(0,0,0,0.3)",
					}}
				/>
			)}

			{piece && (
				<img
					src={PIECE_SVG[`${piece.color}${piece.type.toUpperCase()}` as keyof typeof PIECE_SVG]}
					style={{
						width: "80px",
						height: "80px",
						cursor: "grab",
						opacity: isBeingDragged || isAnimatingTarget ? 0 : 1,
						userSelect: "none",
					}}
					draggable={false}
					onPointerDown={(e) => onPiecePointerDown(square, e)}
				/>
			)}
		</div>
	);
};
