import React from "react";
import { ChessPiece } from "./ChessPiece";
import { PIECE_TYPE_MAP } from "../../constants/boardConstants";
import type { CapturedPiece } from "../../types/types";



interface CapturedPiecesProps {
  capturedPieces: CapturedPiece[];
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  capturedPieces,
}) => {
  const pieces: React.JSX.Element[] = [];

  // Séparer les pièces capturées par couleur
  const whiteCaptured = capturedPieces.filter((p) => p.color === "w");
  const blackCaptured = capturedPieces.filter((p) => p.color === "b");

  // Afficher les pièces blanches capturées sur la gauche
  whiteCaptured.forEach((piece, index) => {
    const pieceName = PIECE_TYPE_MAP[piece.type] || "pawn";
    const col = index % 15;

    // Positionner sur la gauche (-5.5 à -6.5 en x)
    let position;

    if (pieceName == "queen" || pieceName == "bishop") {
      position = [-4.8, 0.1, 4.6 + col * -0.7] as [number, number, number];
    } else if (pieceName == "knight") {
      position = [-4.8, -0.1, 4.6 + col * -0.7] as [number, number, number];
    } else {
      position = [-4.8, 0.001, 4.6 + col * -0.7] as [number, number, number];
    }

    pieces.push(
      <ChessPiece
        key={`captured-white-${index}`}
        position={position}
        type={pieceName}
        color="white"
        square={`captured-white-${index}`}
        onClick={() => {}}
        isSelected={false}
      />,
    );
  });

  // Afficher les pièces noires capturées sur la droite
  blackCaptured.forEach((piece, index) => {
    const pieceName = PIECE_TYPE_MAP[piece.type] || "pawn";
    const col = index % 15;

    // Positionner sur la droite (5.5 à 6.5 en x)
    let position;

    if (pieceName == "knight") {
      position = [4.8, -0.1, -4.6 + col * 0.7] as [number, number, number];
    } else if (pieceName == "queen" || pieceName == "bishop") {
      position = [4.8, 0.1, -4.6 + col * 0.7] as [number, number, number];
    } else {
      position = [4.8, 0.001, -4.6 + col * 0.7] as [number, number, number];
    }

    pieces.push(
      <ChessPiece
        key={`captured-black-${index}`}
        position={position}
        type={pieceName}
        color="black"
        square={`captured-black-${index}`}
        onClick={() => {}}
        isSelected={false}
      />,
    );
  });

  return <>{pieces}</>;
};
