import { Canvas } from "@react-three/fiber";
import "../../styles/Board/ChessGame3D.css";
import { OrbitControls } from "@react-three/drei";
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
  isDemoMode?: boolean;
  playerColor?: "white" | "black";
  active?: boolean;
}

export function ChessGame3D({
  game,
  board,
  selected,
  capturedPieces,
  pendingPromotion,
  onSquareClick,
  onPromotionChoice,
  isDemoMode = false,
  playerColor = "white",
  active = true,
}: ChessGame3DProps) {
  const zSign = playerColor === "black" ? -1 : 1;

  return (
    <>
      {/* gl={{ alpha: true }} libère le fond opaque du Canvas pour le rendre transparent.
          frameloop="never" quand la vue 3D est masquée : le contexte WebGL reste vivant
          (pas de remount) mais le rendu s'arrête pour ne pas gaspiller le GPU. */}
      <Canvas
        camera={{ position: isDemoMode ? [0, 8, 14] : [0, 10, 13 * zSign], fov: 50 }}
        gl={{ alpha: true }}
        frameloop={active ? "always" : "never"}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[20, 100, 20]}
          intensity={1}
          shadow-mapSize={2048}
        />
        <pointLight position={[-10, 100, -10]} intensity={0.8} />

        <BoardRenderer
          selected={isDemoMode ? null : selected}
          onSquareClick={onSquareClick}
          game={game}
          board={board}
        />

        <ChessBoardPieces
          board={board}
          selected={isDemoMode ? null : selected}
          onSquareClick={onSquareClick}
        />

        {!isDemoMode && <CapturedPieces capturedPieces={capturedPieces} />}
        {!isDemoMode && <BoardCoordinates />}

        <PlatformBase />

        <OrbitControls
          autoRotate={isDemoMode}
          autoRotateSpeed={isDemoMode ? 0.6 : 0}
          minPolarAngle={isDemoMode ? Math.PI * 0.2 : Math.PI * 0}
          maxPolarAngle={Math.PI * 0.5}
          minDistance={2}
          maxDistance={30}
        />
      </Canvas>

      {pendingPromotion && !isDemoMode && (
        <PromotionDialog
          onChoose={onPromotionChoice}
          playerColor={game.turn() === "w" ? "w" : "b"}
        />
      )}
    </>
  );
}