export const useChessAI = (onAIMove: (from: string, to: string, promotion?: string) => void) => {
    const requestMove = async (fen: string) => {
        try {
            const response = await fetch("/ai/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fen }),
            });
            const data = await response.json();
            if (data.move) {
                const from = data.move.slice(0, 2);
                const to = data.move.slice(2, 4);
                const promotion = data.move.length > 4 ? data.move[4] : undefined;
                setTimeout(() => onAIMove(from, to, promotion), 300);
            }
        } catch (err) {
            console.error("[ChessAI] Erreur lors de la prédiction :", err);
        }
    };

    return { requestMove };
};