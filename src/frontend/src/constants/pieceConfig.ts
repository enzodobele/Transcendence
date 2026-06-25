export const pieceConfig: { [key: string]: any } = 
{
  pawn: { file: "/chess_pawn.glb", scale: 0.5, rotation: [Math.PI / -2, 0, 0], positionOffset: [0, 0, 0] },
  rook: { file: "/chess__rook.glb", scale: 0.5, rotation: [Math.PI / -2, 0, 0], positionOffset: [0, 0.11, 0] },
  knight: { file: "/chess_knight.glb", scale: 0.12, rotation: [Math.PI / -2, 0, 3], positionOffset: [0, 0.53, 0] },
  bishop: { file: "/chess_bishop.glb", scale: 0.5, rotation: [Math.PI / -2, 0, 0], positionOffset: [1.65, 0, 0] },
  queen: { file: "/chess_queen.glb", scale: 0.5, rotation: [Math.PI / -2, 0, 0], positionOffset: [2.49, 0, 0] },
  king: { file: "/chess_king.glb", scale: 0.5, rotation: [Math.PI / -2, 0, 0], positionOffset: [3.42, 0, 0] },
};
