import wKingSvg from "../assets/pieces/wK.svg";
import wQueenSvg from "../assets/pieces/wQ.svg";
import wRookSvg from "../assets/pieces/wR.svg";
import wBishopSvg from "../assets/pieces/wB.svg";
import wKnightSvg from "../assets/pieces/wN.svg";
import wPawnSvg from "../assets/pieces/wP.svg";
import bKingSvg from "../assets/pieces/bK.svg";
import bQueenSvg from "../assets/pieces/bQ.svg";
import bRookSvg from "../assets/pieces/bR.svg";
import bBishopSvg from "../assets/pieces/bB.svg";
import bKnightSvg from "../assets/pieces/bN.svg";
import bPawnSvg from "../assets/pieces/bP.svg";

export const PIECE_SVG = {
  wK: wKingSvg,
  wQ: wQueenSvg,
  wR: wRookSvg,
  wB: wBishopSvg,
  wN: wKnightSvg,
  wP: wPawnSvg,
  bK: bKingSvg,
  bQ: bQueenSvg,
  bR: bRookSvg,
  bB: bBishopSvg,
  bN: bKnightSvg,
  bP: bPawnSvg,
} as const;

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;
