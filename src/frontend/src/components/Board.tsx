import React from "react";
import { Square2D } from "./Square2D";
import { FILES, RANKS } from "../constants/pieces";

interface BoardProps {
    board: any[][];
    game: any;
    selected: string | null;
    lastMove: { from: string; to: string } | null;
    isDragging: boolean;
    onSquareClick: (square: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (square: string, e: React.DragEvent) => void;
    onDragStart: (square: string, e: React.DragEvent) => void;
    onDragEnd: () => void;
    playerColor: 'white' | 'black'; // 💡 Étape 1 : On ajoute la couleur aux props
}

export const Board: React.FC<BoardProps> = ({
    board,
    game,
    selected,
    lastMove,
    isDragging,
    onSquareClick,
    onDragOver,
    onDrop,
    onDragStart,
    onDragEnd,
    playerColor, // 💡 Étape 2 : On la récupère ici
}) => {
    // 💡 Étape 3 : Si le joueur est noir, on prépare les index inversés
    const isBlack = playerColor === 'black';

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 100px)",
                gap: 0,
                marginBottom: "20px",
            }}
        >
            {board.map((row, rowIndex) => {
                // Si Noir : on part du bas du tableau vers le haut
                const actualRowIndex = isBlack ? 7 - rowIndex : rowIndex;
                const currentRow = board[actualRowIndex];

                return currentRow.map((piece, colIndex) => {
                    // Si Noir : on inverse aussi les colonnes (de 'h' à 'a')
                    const actualColIndex = isBlack ? 7 - colIndex : colIndex;
                    const actualPiece = currentRow[actualColIndex];

                    const file = FILES[actualColIndex];
                    const rank = RANKS[actualRowIndex];
                    const square = file + rank;
                    
                    // La couleur de la case dépend des index réels de l'échiquier
                    const isLight = (actualColIndex + actualRowIndex) % 2 === 0;
                    const isSelected = selected === square;

                    let possibleMoves: string[] = [];

                    if (selected) {
                        possibleMoves = game
                            .moves({ square: selected, verbose: true })
                            .map((m: any) => m.to);
                    }

                    const isPossibleMove = possibleMoves.includes(square);
                    const isCapture = isPossibleMove && actualPiece;

                    return (
                        <Square2D
                            key={square}
                            square={square}
                            piece={actualPiece} // 💡 On passe la pièce correspondante à la vue inversée
                            isLight={isLight}
                            isSelected={isSelected}
                            isPossibleMove={isPossibleMove}
                            isCapture={isCapture}
                            lastMove={lastMove}
                            isDragging={isDragging}
                            onClick={onSquareClick}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                        />
                    );
                });
            })}
        </div>
    );
};