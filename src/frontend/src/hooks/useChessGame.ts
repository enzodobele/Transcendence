import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";

import moveSound from "../assets/sounds/move-self.mp3";
import captureSound from "../assets/sounds/capture.mp3";
import castleSound from "../assets/sounds/castle.mp3";
import checkSound from "../assets/sounds/move-check.mp3";
import promoteSound from "../assets/sounds/promote.mp3";
import gameEndSound from "../assets/sounds/game-end.mp3";

const playSound = (soundFile: string) =>
{
    const audio = new Audio(soundFile);
    audio.play().catch(() => {});
};

const extractCapturedPieces = (game: Chess): CapturedPiece[] =>
{
    const captured: CapturedPiece[] = [];
    const moves = game.history({ verbose: true });

    moves.forEach((move) =>
    {
        if (move.captured)
        {
            const captureColor: "w" | "b" = move.color === "w" ? "b" : "w";
            captured.push({ type: move.captured, color: captureColor });
        }
    });

    return captured;
};

interface CapturedPiece
{
    type: string;
    color: "w" | "b";
}

interface PendingPromotion
{
    from: string;
    to: string;
}

export interface DragPiece
{
    square: string;
    x: number;
    y: number;
}

export interface AnimatingPiece
{
    pieceKey: string;
    toSquare: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

// 💡 Étape 1 : On passe playerColor au hook (valeur par défaut 'white' pour le mode local)
export const useChessGame = (
    playerColor: 'white' | 'black' = 'white',
    onMovePlayed?: (moveData: { from: string; to: string; promotion?: string }) => void
) => {
    const [game] = useState(() => new Chess());
    const [board, setBoard] = useState(game.board());
    const [selected, setSelected] = useState<string | null>(null);
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
    const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);
    const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
    const [dragPiece, setDragPiece] = useState<DragPiece | null>(null);
    const [animatingPiece, setAnimatingPiece] = useState<AnimatingPiece | null>(null);

    const dragRef = useRef<{ square: string; startX: number; startY: number; started: boolean } | null>(null);
    const dragEndedAt = useRef<string | null>(null);

    // 🔐 Étape 2 : Fonction utilitaire de vérification de droits
    const isMyTurn = () => {
        const currentTurn = game.turn(); // 'w' ou 'b'
        const expectedTurn = playerColor === 'white' ? 'w' : 'b';
        return currentTurn === expectedTurn;
    };

    const playMoveSound = (move: any) =>
    {
        if (!move) return;

        if (move.flags.includes("p"))
            playSound(promoteSound);
        else if (move.flags.includes("k") || move.flags.includes("q"))
            playSound(castleSound);
        else if (move.flags.includes("c") || move.flags.includes("e"))
            playSound(captureSound);
        else if (game.inCheck())
            playSound(checkSound);
        else
            playSound(moveSound);

        if (game.isCheckmate() || game.isStalemate())
            setTimeout(() => playSound(gameEndSound), 300);
    };

	const syncWithServerFen = (fen: string) => {
        game.load(fen);
        setBoard(game.board());
        // Si la fonction extractCapturedPieces existe, garde-la, sinon commente cette ligne :
        if (typeof extractCapturedPieces === 'function') {
            setCapturedPieces(extractCapturedPieces(game));
        }
    };

    const makeMove = (from: string, to: string, promotion?: string, animate = true) =>
    {
        const piece = game.get(from as any);
        const move = game.move({
            from: from as any,
            to: to as any,
            ...(promotion && { promotion: promotion as any })
        });
        if (move)
        {
            setBoard(game.board());
            setSelected(null);
            setLastMove({ from, to });
            setCapturedPieces(extractCapturedPieces(game));
            playMoveSound(move);

			if (onMovePlayed) {
                onMovePlayed({ from, to, promotion });
            }

            if (animate && piece)
            {
                const fromEl = document.querySelector(`[data-square="${from}"]`);
                const toEl = document.querySelector(`[data-square="${to}"]`);
                const fromRect = fromEl?.getBoundingClientRect();
                const toRect = toEl?.getBoundingClientRect();

                if (fromRect && toRect)
                {
                    setAnimatingPiece({
                        pieceKey: `${piece.color}${piece.type.toUpperCase()}`,
                        toSquare: to,
                        fromX: fromRect.left + fromRect.width / 2,
                        fromY: fromRect.top + fromRect.height / 2,
                        toX: toRect.left + toRect.width / 2,
                        toY: toRect.top + toRect.height / 2,
                    });
                }
            }
        }
        return move;
    };

    const handleSquareClick = (square: string) =>
    {
        // 🔐 Sécurité : Interdit toute action si ce n'est pas le tour du joueur
        if (!isMyTurn()) return;

        if (dragEndedAt.current === square)
        {
            dragEndedAt.current = null;
            return;
        }

        if (pendingPromotion)
        {
            handlePromotionChoice(square);
            return;
        }

        if (selected === square)
        {
            setSelected(null);
            return;
        }

        const clickedPiece = game.get(square as any);
        const currentTurn = game.turn();

        // On vérifie en plus que la pièce cliquée est bien de la couleur du joueur actuel
        if (clickedPiece && clickedPiece.color === currentTurn)
            setSelected(square);

        else if (selected !== null)
        {
            const possibleMoves = game
                .moves({ square: selected as any, verbose: true })
                .map((m: any) => m.to);

            if (possibleMoves.includes(square))
            {
                const allMoves = game.moves({ square: selected as any, verbose: true });
                const moveData = allMoves.find((m: any) => m.to === square);

                if (moveData && moveData.flags.includes("p"))
                {
                    setPendingPromotion({ from: selected, to: square });
                    setSelected(null);
                }
                else
                    makeMove(selected, square);
            }
            else
                setSelected(null);
        }
    };

    const handlePiecePointerDown = (square: string, e: React.PointerEvent) =>
    {
        // 🔐 Sécurité : Impossible de lever (drag) une pièce hors de son tour ou adverse
        if (!isMyTurn()) return;

        const piece = game.get(square as any);
        if (!piece || piece.color !== game.turn()) return;
        
        e.preventDefault();
        dragRef.current = { square, startX: e.clientX, startY: e.clientY, started: true };
        setDragPiece({ square, x: e.clientX, y: e.clientY });
        document.body.classList.add("dragging");
    };

    useEffect(() =>
    {
        const onMove = (e: PointerEvent) =>
        {
            if (!dragRef.current) return;
            setDragPiece({ square: dragRef.current.square, x: e.clientX, y: e.clientY });
        };

        const onUp = (e: PointerEvent) =>
        {
            const ref = dragRef.current;
            dragRef.current = null;
            document.body.classList.remove("dragging");
            setDragPiece(null);

            if (!ref) return;

            const wasMoved = Math.hypot(e.clientX - ref.startX, e.clientY - ref.startY) > 3;

            if (!wasMoved) return; // clic simple → laisser onClick gérer la sélection

            const elem = document.elementFromPoint(e.clientX, e.clientY);
            const squareEl = elem?.closest("[data-square]") as HTMLElement | null;
            const targetSquare = squareEl?.dataset.square;

            if (targetSquare && targetSquare !== ref.square)
            {
                const allMoves = game.moves({ square: ref.square as any, verbose: true });
                const moveData = allMoves.find((m: any) => m.to === targetSquare);

                if (!moveData)
                {
                    dragEndedAt.current = targetSquare;
                    setSelected(ref.square);
                }
                else if (moveData.flags.includes("p"))
                {
                    setPendingPromotion({ from: ref.square, to: targetSquare });
                    setSelected(null);
                }
                else
                    makeMove(ref.square, targetSquare, undefined, false);
            }
            else
            {
                if (targetSquare) dragEndedAt.current = targetSquare;
                setSelected(ref.square);
            }
        };

        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);

        return () =>
        {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
        };
    }, [playerColor, game]); // 💡 Ajout des dépendances pour suivre la couleur dynamique

    const handlePromotionChoice = (piece: string) =>
    {
        if (!pendingPromotion) return;

        const pieceMap: { [key: string]: string } =
        {
            queen: "q", rook: "r", bishop: "b", knight: "n",
            q: "q", r: "r", b: "b", n: "n"
        };

        const promotionType = pieceMap[piece.toLowerCase()];
        if (!promotionType) return;

        makeMove(pendingPromotion.from, pendingPromotion.to, promotionType);
        setPendingPromotion(null);
    };

    const resetGame = () =>
    {
        game.reset();
        setBoard(game.board());
        setSelected(null);
        setLastMove(null);
        setCapturedPieces([]);
        setPendingPromotion(null);
        setDragPiece(null);
        dragRef.current = null;
        document.body.classList.remove("dragging");
    };

    return {
        game,
        board,
        selected,
        lastMove,
        makeMove,
        dragPiece,
        animatingPiece,
        clearAnimation: () => setAnimatingPiece(null),
        handleSquareClick,
        handlePiecePointerDown,
        resetGame,
        capturedPieces,
        pendingPromotion,
        handlePromotionChoice,
        syncWithServerFen,
    };
};