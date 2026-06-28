// src/frontend/src/hooks/chess/chessSoundService.ts
import { Chess } from "chess.js";
import moveSound from "../../assets/sounds/move-self.mp3";
import captureSound from "../../assets/sounds/capture.mp3";
import castleSound from "../../assets/sounds/castle.mp3";
import checkSound from "../../assets/sounds/move-check.mp3";
import promoteSound from "../../assets/sounds/promote.mp3";
import gameEndSound from "../../assets/sounds/game-end.mp3";

const playAudio = (soundFile: string) => {
  const audio = new Audio(soundFile);
  audio.play().catch(() => {});
};

export const playMoveSound = (move: any, game: Chess) => {
  if (!move) return;

  if (move.flags.includes("p")) {
    playAudio(promoteSound);
  } else if (move.flags.includes("k") || move.flags.includes("q")) {
    playAudio(castleSound);
  } else if (move.flags.includes("c") || move.flags.includes("e")) {
    playAudio(captureSound);
  } else if (game.inCheck()) {
    playAudio(checkSound);
  } else {
    playAudio(moveSound);
  }

  if (game.isCheckmate() || game.isStalemate()) {
    setTimeout(() => playAudio(gameEndSound), 300);
  }
};
