import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useState } from "react";
import { useChessGame } from "./hooks/useChessGame";
import { BoardRenderer } from "./components/BoardRenderer";
import { ChessBoardPieces } from "./components/ChessBoardPieces";
import { CapturedPieces } from "./components/CapturedPieces";
import { PromotionDialog } from "./components/PromotionDialog";
import { PlatformBase } from "./components/PlatformBase";
import { BoardCoordinates } from "./components/BoardCoordinates";
import { Board } from "./components/Board";
import connexionLogo from "./assets/Logo/login.svg";
import "./App.css";
import {Login} from "./components/Login";

export default function App() {
  const {
    game,
    board,
    selected,
    handleSquareClick,
    resetGame,
    lastMove,
    isDragging,
    setIsDragging,
    handleDragStart,
    handleDragOver,
    handleDrop,
    capturedPieces,
    pendingPromotion,
    handlePromotionChoice,
  	} = useChessGame();

	const [is3D, setIs3D] = useState(false);
	const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {is3D ? (
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
              <meshStandardMaterial
                color="#6b7280"
                side={THREE.BackSide}
              />
            </mesh>

            <BoardRenderer
              selected={selected}
              onSquareClick={handleSquareClick}
              game={game}
              board={board}
            />

            <ChessBoardPieces
              board={board}
              selected={selected}
              onSquareClick={handleSquareClick}
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

          <button
            onClick={resetGame}
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Réinitialiser
          </button>

          {pendingPromotion && (
            <PromotionDialog
              onChoose={handlePromotionChoice}
              playerColor={game.turn() === "w" ? "w" : "b"}
            />
          )}
        </>
      ) : (
        <div className="Board">
        	<Board
        	board={board}
            game={game}
            selected={selected}
            lastMove={lastMove}
            isDragging={isDragging}
            onSquareClick={handleSquareClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={() => setIsDragging(false)}
        />
        <button className="connexion-button" onClick={() => setIsLoginOpen(true)}>
            <img
            	src={connexionLogo}
            	alt="connexion"
            	className="connexion-logo"
            />
            Connexion
        </button>

		<Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}/>

        <button onClick={resetGame} className="reset-board">
        	Réinitialiser
        </button>

          {pendingPromotion && (
            <PromotionDialog
              onChoose={handlePromotionChoice}
              playerColor={game.turn() === "w" ? "b" : "w"}
            />
          )}
        </div>
      )}
      {/* bouton switch 2D / 3D */}
      <button
        onClick={() => setIs3D(!is3D)}
        className="button-switch-2d-3d"
      >
        {is3D ? "Vue 2D" : "Vue 3D"}
      </button>
    </div>
  );
}