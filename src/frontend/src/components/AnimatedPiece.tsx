import { useState, useEffect, useRef } from "react";
import { PIECE_SVG } from "../constants/pieces";
import type { AnimatingPiece as AnimatingPieceData } from "../hooks/useChessGame";

interface AnimatedPieceProps
{
	data: AnimatingPieceData;
	onDone: () => void;
}

export function AnimatedPiece({ data, onDone }: AnimatedPieceProps)
{
	const [arrived, setArrived] = useState(false);
	const rafRef = useRef<number>(0);

	useEffect(() =>
	{
		rafRef.current = requestAnimationFrame(() =>
		{
			rafRef.current = requestAnimationFrame(() => setArrived(true));
		});
		return () => cancelAnimationFrame(rafRef.current);
	}, []);

	const dx = data.toX - data.fromX;
	const dy = data.toY - data.fromY;

	return (
		<img
			src={PIECE_SVG[data.pieceKey as keyof typeof PIECE_SVG]}
			style={{
				position: "fixed",
				left: data.fromX - 40,
				top: data.fromY - 40,
				width: 80,
				height: 80,
				pointerEvents: "none",
				zIndex: 9998,
				userSelect: "none",
				transform: arrived ? `translate(${dx}px, ${dy}px)` : "translate(0, 0)",
				transition: arrived ? "transform 0.15s ease-out" : "none",
			}}
			onTransitionEnd={onDone}
		/>
	);
}
