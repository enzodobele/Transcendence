import React from "react";

interface SquareProps
{
	position: number[];
	color: string;
	isPossibleMove: boolean;
	isSelected: boolean;
	onClick: () => void;
}

export const Square: React.FC<SquareProps> = ({
	position,
	color,
	isPossibleMove,
	isSelected,
	onClick,
}) =>
{
	let squareColor = color;
	let emissiveColor = "#000000";

	if (isSelected)
	{
		squareColor = "#7ec850";
		emissiveColor = "#5a9c3a";
	}
	else if (isPossibleMove)
	{
		squareColor = "#baca44";
		emissiveColor = "#8b9d2d";
	}

	return (
		<mesh
			position={position as any}
			onClick={onClick}
		>
			<boxGeometry args={[1, 0.2, 1]} />
			<meshStandardMaterial
				color={squareColor}
				emissive={emissiveColor}
			/>
		</mesh>
	);
};