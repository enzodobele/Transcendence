import React from "react";
import { PIECE_SVG } from "../constants/pieces";

interface Square2DProps {
	square: string;
	piece: any;
	isLight: boolean;
	isSelected: boolean;
	isPossibleMove: boolean;
	isCapture: boolean;
	lastMove: { from: string; to: string } | null;
	isDragging: boolean;
	onClick: (square: string) => void;
	onDragOver: (e: React.DragEvent) => void;
	onDrop: (square: string, e: React.DragEvent) => void;
	onDragStart: (square: string, e: React.DragEvent) => void;
	onDragEnd: () => void;
}

export const Square2D: React.FC<Square2DProps> = ({
	square,
	piece,
	isLight,
	isSelected,
	isPossibleMove,
	isCapture,
	lastMove,
	isDragging,
	onClick,
	onDragOver,
	onDrop,
	onDragStart,
	onDragEnd,
}) => {
	let baseColor;

	if (isLight)
		baseColor = "#f0d9b5";
	else
		baseColor = "#b58863";

	let backgroundColor = baseColor;

	if (lastMove && (lastMove.from === square || lastMove.to === square))
		backgroundColor = "#baca44";

	if (isSelected && !isDragging)
		backgroundColor = "#7ec850";
	else if (isPossibleMove)
	{
		if (isCapture)
			backgroundColor = "#e84c3d";
		else
			backgroundColor = "#baca44";
	}

	const handleClick = () => onClick(square);

	const handleDragStart = (e: React.DragEvent) => {
		onDragStart(square, e);
	};

	const handleDrop = (e: React.DragEvent) => {
		onDrop(square, e);
	};

	return (
		<div
			style={{
				width: "100px",
				height: "100px",
				backgroundColor,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				cursor: "pointer",
				position: "relative",
				border: "1px solid rgba(0,0,0,0.1)",
			}}
			onClick={handleClick}
			onDragOver={onDragOver}
			onDrop={handleDrop}
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
					}}
					draggable
					onDragStart={handleDragStart}
					onDragEnd={onDragEnd}
					onDragOver={(e) => e.preventDefault()}
				/>
			)}
		</div>
	);
};