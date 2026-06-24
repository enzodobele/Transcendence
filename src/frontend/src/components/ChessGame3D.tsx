import { Canvas } from "@react-three/fiber";
import "../styles/ChessGame3D.css";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { BoardRenderer } from "./BoardRenderer";
import { ChessBoardPieces } from "./ChessBoardPieces";
import { CapturedPieces } from "./CapturedPieces";
import { PromotionDialog } from "./PromotionDialog";
import { PlatformBase } from "./PlatformBase";
import { BoardCoordinates } from "./BoardCoordinates";

interface ChessGame3DProps {
  game: any;
  board: any;
  selected: any;
  capturedPieces: any;
  pendingPromotion: boolean;
  onSquareClick: (square: string) => void;
  onResetGame: () => void;
  onPromotionChoice: (piece: string) => void;
}

export function ChessGame3D({
  game,
  board,
  selected,
  capturedPieces,
  pendingPromotion,
  onSquareClick,
  onResetGame,
  onPromotionChoice,
}: ChessGame3DProps) {
  return (
    <>
      <Canvas camera={{ position: [5, 8, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[20, 100, 20]}
          intensity={1}
          shadow-mapSize={2048}
        />
        <pointLight position={[-10, 100, -10]} intensity={0.8} />

        <fog attach="fog" args={["#696969", 10, 200]} />

        <mesh>
          <boxGeometry args={[500, 300, 500]} />
          <meshStandardMaterial color="#6b7280" side={THREE.BackSide} />
        </mesh>

        <BoardRenderer
          selected={selected}
          onSquareClick={onSquareClick}
          game={game}
          board={board}
        />

        <ChessBoardPieces
          board={board}
          selected={selected}
          onSquareClick={onSquareClick}
        />

        <CapturedPieces capturedPieces={capturedPieces} />
        <BoardCoordinates />
        <PlatformBase />

        <OrbitControls
          autoRotate
          autoRotateSpeed={0}
          minPolarAngle={Math.PI * 0}
          maxPolarAngle={Math.PI * 0.5}
          minDistance={2}
          maxDistance={30}
        />
      </Canvas>
      {pendingPromotion && (
        <PromotionDialog
          onChoose={onPromotionChoice}
          playerColor={game.turn() === "w" ? "w" : "b"}
        />
      )}
    </>
  );
}
