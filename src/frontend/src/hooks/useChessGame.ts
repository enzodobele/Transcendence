import { useState } from "react";
import { Chess } from "chess.js";

// Import des sons
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

	moves.forEach((move: any) =>
	{
		if (move.captured)
		{
			// Déterminer la couleur de la pièce capturée (opposée au joueur qui a joué)
			let captureColor;
			if (move.color === 'w')
				captureColor = 'b';
			else
				captureColor = 'w';
			captured.push({ type: move.captured, color: captureColor });
		}
	});
	return captured;
};

interface CapturedPiece
{
	type: string;
	color: 'w' | 'b';
}

interface PendingPromotion
{
	from: string;
	to: string;
}

export const useChessGame = () =>
{
	const [game] = useState(() => new Chess());
	const [board, setBoard] = useState(game.board());
	const [selected, setSelected] = useState<string | null>(null);
	const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);
	const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

	const playMoveSound = (move: any) =>
	{
		if (!move) return;

		// Promotion
		if (move.flags.includes("p"))
			playSound(promoteSound);

		// Roque
		else if (move.flags.includes("k") || move.flags.includes("q"))
			playSound(castleSound);

		// Capture
		else if (move.flags.includes("c") || move.flags.includes("e"))
			playSound(captureSound);

		// Échec
		else if (game.inCheck())
			playSound(checkSound);

		// Coup normal
		else
			playSound(moveSound);

		// Checkmate ou Stalemate
		if (game.isCheckmate() || game.isStalemate())
			setTimeout(() => playSound(gameEndSound), 300);
	};

	const handleSquareClick = (square: string) =>
	{
		// Si une promotion est en attente, traiter le clic comme un choix de pièce
		if (pendingPromotion)
		{
			handlePromotionChoice(square);
			return;
		}

		// Si on clique sur la même case/pièce, on désélectionne
		if (selected === square)
		{
			setSelected(null);
			return;
		}

		const clickedPiece = game.get(square as any);
		const currentTurn = game.turn();

		if (clickedPiece && clickedPiece.color === currentTurn)
			setSelected(square);

		else if (selected !== null)
		{
			const possibleMoves = game
				.moves({ square: selected as any, verbose: true })
				.map((m: any) => m.to);

			if (possibleMoves.includes(square))
			{
				// Vérifie si c'est un mouvement de promotion
				const allMoves = game.moves({ square: selected as any, verbose: true });
				const moveData = allMoves.find((m: any) => m.to === square);

				if (moveData && moveData.flags.includes('p'))
				{
					// C'est une promotion, on attend le choix de l'utilisateur
					setPendingPromotion({ from: selected, to: square });
					setSelected(null);
				}
				else
				{
					const move = game.move({ from: selected as any, to: square as any });

					if (move)
					{
						setBoard(game.board());
						setSelected(null);
						setLastMove({ from: selected, to: square });
						setCapturedPieces(extractCapturedPieces(game));
						playMoveSound(move);
					}
				}
			}
			else
				setSelected(null);
		}
	};

	const handleDragStart = (square: string, e: React.DragEvent) =>
	{
		const piece = game.get(square as any);
		const currentTurn = game.turn();

		if (piece && piece.color === currentTurn)
		{
			e.dataTransfer!.effectAllowed = "move";
			e.dataTransfer!.setData("text/plain", square);
			setSelected(square);
			setIsDragging(true);

			// Créer une image de drag propre sans le fond du carré
			const img = e.target as HTMLImageElement;
			const canvas = document.createElement('canvas');
			canvas.width = 80;
			canvas.height = 80;
			const ctx = canvas.getContext('2d');

			if (ctx)
			{
				ctx.drawImage(img, 0, 0, 80, 80);
				e.dataTransfer!.setDragImage(canvas, 40, 40);
			}
		}
		else
		{
			e.dataTransfer!.effectAllowed = "none";
			e.preventDefault();
		}
	};

	const handleDragOver = (e: React.DragEvent) =>
	{
		e.preventDefault();
		e.dataTransfer!.dropEffect = "move";
	};

	const handleDrop = (square: string, e: React.DragEvent) =>
	{
		e.preventDefault();
		setIsDragging(false);

		// Si une promotion est en attente, traiter le clic comme un choix de pièce
		if (pendingPromotion)
		{
			handlePromotionChoice(square);
			return;
		}

		const fromSquare = e.dataTransfer!.getData("text/plain");
		if (!fromSquare) return;

		const possibleMoves = game
			.moves({ square: fromSquare as any, verbose: true })
			.map((m: any) => m.to);

		if (possibleMoves.includes(square))
		{
			// Vérifie si c'est un mouvement de promotion
			const allMoves = game.moves({ square: fromSquare as any, verbose: true });
			const moveData = allMoves.find((m: any) => m.to === square);

			if (moveData && moveData.flags.includes('p'))
			{
				// C'est une promotion, on attend le choix de l'utilisateur
				setPendingPromotion({ from: fromSquare, to: square });
			}
			else
			{
				const move = game.move({ from: fromSquare as any, to: square as any });

				if (move)
				{
					playMoveSound(move);
					setBoard(game.board());
					setSelected(null);
					setLastMove({ from: fromSquare, to: square });
					setCapturedPieces(extractCapturedPieces(game));
				}
			}
		}
	};

	const handlePromotionChoice = (piece: string) =>
	{
		if (!pendingPromotion) return;

		const pieceMap: { [key: string]: string } =
		{
			queen: 'q',
			rook: 'r',
			bishop: 'b',
			knight: 'n',
			q: 'q',
			r: 'r',
			b: 'b',
			n: 'n'
		};

		const promotionType = pieceMap[piece.toLowerCase()];

		if (!promotionType) return;

		const move = game.move({
			from: pendingPromotion.from as any,
			to: pendingPromotion.to as any,
			promotion: promotionType as any
		});

		if (move)
		{
			playMoveSound(move);
			setBoard(game.board());
			setLastMove({ from: pendingPromotion.from, to: pendingPromotion.to });
			setCapturedPieces(extractCapturedPieces(game));
		}

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
	};

	return {
		game,
		board,
		selected,
		lastMove,
		isDragging,
		setIsDragging,
		handleSquareClick,
		handleDragStart,
		handleDragOver,
		handleDrop,
		resetGame,
		capturedPieces,
		pendingPromotion,
		handlePromotionChoice,
	};
};