// src/frontend/src/hooks/chess/chessSoundService.ts
import { Chess } from "chess.js";
import moveSound from "../../assets/sounds/move-self.mp3";
import captureSound from "../../assets/sounds/capture.mp3";
import castleSound from "../../assets/sounds/castle.mp3";
import checkSound from "../../assets/sounds/move-check.mp3";
import promoteSound from "../../assets/sounds/promote.mp3";
import gameEndSound from "../../assets/sounds/game-end.mp3";

const soundFiles = {
  move: moveSound,
  capture: captureSound,
  castle: castleSound,
  check: checkSound,
  promote: promoteSound,
  gameEnd: gameEndSound,
};

const preloadedAudio = Object.fromEntries(
  Object.entries(soundFiles).map(([key, src]) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.load();
    return [key, audio];
  }),
) as Record<keyof typeof soundFiles, HTMLAudioElement>;

const playAudio = (key: keyof typeof soundFiles) => {
  const audio = preloadedAudio[key];
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

export const playMoveSound = (move: any, game: Chess) => {
  if (!move) return;

  if (move.flags.includes("p")) {
    playAudio("promote");
  } else if (move.flags.includes("k") || move.flags.includes("q")) {
    playAudio("castle");
  } else if (move.flags.includes("c") || move.flags.includes("e")) {
    playAudio("capture");
  } else if (game.inCheck()) {
    playAudio("check");
  } else {
    playAudio("move");
  }

  if (game.isCheckmate() || game.isStalemate()) {
    setTimeout(() => playAudio("gameEnd"), 300);
  }
};
