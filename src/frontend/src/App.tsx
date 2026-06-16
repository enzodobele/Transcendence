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
import AuthSandbox from "./AuthSandbox"; // 1. Import de votre bac à sable
import { useGameSocket } from "./hooks/useGameSocket";

export default function App() {
  const { status, color, sendMove, opponentMove, result } = useGameSocket();
  const myColor = color === "white" ? "w" : color === "black" ? "b" : null;
  const { game, board, selected, handleSquareClick, resetGame, lastMove, isDragging, setIsDragging, handleDragStart, handleDragOver, handleDrop, capturedPieces, pendingPromotion, handlePromotionChoice } = useChessGame(sendMove, opponentMove, myColor);
  const [is3D, setIs3D] = useState(true);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {status === "over" && (
        <div style={{ position: "absolute", inset: 0, background: "#000c", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <h1>Partie terminée</h1>
          <p style={{ fontSize: 20 }}>
            {result?.reason === "checkmate"   && `Échec et mat — ${result.winner === "w" ? "Blancs" : "Noirs"} gagnent 👑`}
            {result?.reason === "stalemate"   && "Pat — match nul"}
            {result?.reason === "draw"        && "Match nul"}
            {result?.reason === "opponentLeft"&& "Ton adversaire a quitté la partie 🏳️"}
          </p>
        </div>
      )}
      <div style={{ position: "absolute", top: 70, left: 20, zIndex: 10, background: "#000a", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
        Statut : {status} {color ? `- tu es ${color}` : ""}
      </div>
      {is3D ? (
        <>
          <Canvas camera={{ position: [5, 8, 5] }}>
			
            {/* Lumières */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[20, 100, 20]} intensity={1} shadow-mapSize={2048} />
            <pointLight position={[-10, 100, -10]} intensity={0.8} />
            
            {/* Brouillard pour illusion d'infini */}
        	<fog attach="fog" args={["#696969", 10, 200]} />
            
            {/* Cube uniforme très large */}
            <mesh>
            	<boxGeometry args={[500, 300, 500]} />
            	<meshStandardMaterial color="#6b7280" side={THREE.BackSide} />
            </mesh>
            
            {/* Plateau */}
            <BoardRenderer selected={selected} onSquareClick={handleSquareClick} game={game} board={board} />

            {/* Pièces */}
            <ChessBoardPieces board={board} selected={selected} onSquareClick={handleSquareClick} />

            {/* Pièces capturées */}
            <CapturedPieces capturedPieces={capturedPieces} />

            {/* Coordonnées du plateau */}
            <BoardCoordinates />

            {/* Base du plateau */}
            <PlatformBase />

            {/* Contrôles de caméra */}
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
            	borderRadius: "4px"
            }}
          >
            Réinitialiser
          </button>
          {pendingPromotion && (
            <PromotionDialog
              onChoose={handlePromotionChoice}
              playerColor={game.turn() === 'w' ? 'b' : 'w'}
            />
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "#2a2a2a" }}>
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
          <button 
            onClick={resetGame}
            style={{
            	marginTop: "20px",
            	padding: "10px 20px",
            	fontSize: "16px",
            	cursor: "pointer",
            	backgroundColor: "#4CAF50",
            	color: "white",
            	border: "none",
            	borderRadius: "4px"
            }}
          >
            Réinitialiser
          </button>
          {pendingPromotion && (
            <PromotionDialog
              onChoose={handlePromotionChoice}
              playerColor={game.turn() === 'w' ? 'b' : 'w'}
            />
          )}
        </div>
      )}
      
      {(() => {
        let buttonText;
        if (is3D) {
          buttonText = "Vue 2D";
        } else {
          buttonText = "Vue 3D";
        }
        return (
          <button 
            onClick={() => setIs3D(!is3D)}
            style={{
            	position: "absolute",
            	top: "20px",
            	right: "20px",
            	padding: "10px 20px",
            	fontSize: "16px",
            	cursor: "pointer",
            	backgroundColor: "#2196F3",
            	color: "white",
            	border: "none",
            	borderRadius: "4px"
            }}
          >
            {buttonText}
          </button>
        );
      })()}
    <div
      style={{
        display: "flex",
        flexDirection: "row", // 2. Aligne l'Auth et le Jeu côte à côte (mettez "column" pour superposer)
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "40px",
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      {/* 3. Bloc d'Authentification temporaire */}
      <div style={{ marginTop: "60px" }}>
        <AuthSandbox />
      </div>

      {/* 4. Bloc Jeu d'échecs d'origine */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1>♔ Chess ♚</h1>

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

        {/* <ResetButton onClick={resetGame} /> */}
      </div>
    </div>
</div>
  );

}