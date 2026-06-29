import React from "react";
import { Square } from "./Square";
import { FILES, RANKS } from "../../constants/boardConstants";

interface BoardRendererProps {
  selected: string | null;
  onSquareClick: (square: string) => void;
  game: any;
  board: any[];
}

export const BoardRenderer: React.FC<BoardRendererProps> = ({
  selected,
  onSquareClick,
  game,
}) => {
  const squares = [];

  for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 8; z++) {
      const isWhite = (x + z) % 2 === 0;
      const file = FILES[x];
      const rank = RANKS[z];
      const square = file + rank;
      const isSelected = selected === square;

      let possibleMoves: string[] = [];

      if (selected) {
        possibleMoves = game
          .moves({ square: selected, verbose: true })
          .map((m: any) => m.to);
      }

      const isPossibleMove = possibleMoves.includes(square);

      let squareBaseColor = "#b58863";

      if (isWhite) {
        squareBaseColor = "#f0d9b5";
      }

      squares.push(
        <Square
          key={`${x}-${z}`}
          position={[x - 3.5, 0, z - 3.5]}
          color={squareBaseColor}
          isSelected={isSelected}
          isPossibleMove={isPossibleMove}
          onClick={() => onSquareClick(square)}
        />,
      );
    }
  }

  // Grille noire entre les cases
  const gridLines = [];
  const lineThickness = 0.05;
  const lineHeight = 0.1;

  // Lignes horizontales (Z)
  for (let x = 0; x < 9; x++) {
    gridLines.push(
      <mesh key={`line-h-${x}`} position={[x - 4, lineHeight, 0]}>
        <boxGeometry args={[lineThickness, 0.01, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>,
    );
  }

  // Lignes verticales (X)
  for (let z = 0; z < 9; z++) {
    gridLines.push(
      <mesh key={`line-v-${z}`} position={[0, lineHeight, z - 4]}>
        <boxGeometry args={[8, 0.01, lineThickness]} />
        <meshStandardMaterial color="#000000" />
      </mesh>,
    );
  }

  // Bandes noires sur les bords du plateau
  const borderSize = 0.4;
  const borders = [];

  borders.push(
    <mesh
      key="border-front"
      position={[0, -0.01, -3.9 - borderSize / 2]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <boxGeometry args={[8 + 0.25, 0.15, 0.2]} />
      <meshStandardMaterial color="#000000" />
    </mesh>,
  );

  borders.push(
    <mesh
      key="border-back"
      position={[0, -0.14, 3.8 + borderSize / 2]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <boxGeometry args={[8.25, 0.15, 0.5]} />
      <meshStandardMaterial color="#000000" />
    </mesh>,
  );

  borders.push(
    <mesh
      key="border-left"
      position={[-3.85 - 0.2, -0.1, 0]}
      rotation={[0, 0, Math.PI / 2]}
    >
      <boxGeometry args={[borderSize, 0.15, 8.1]} />
      <meshStandardMaterial color="#000000" />
    </mesh>,
  );

  borders.push(
    <mesh
      key="border-right"
      position={[3.85 + borderSize / 2, 0.001, 0]}
      rotation={[0, 0, Math.PI / 2]}
    >
      <boxGeometry args={[0.2, 0.15, 8.1]} />
      <meshStandardMaterial color="#000000" />
    </mesh>,
  );

  return (
    <>
      {squares}
      {gridLines}
      {borders}
    </>
  );
};
