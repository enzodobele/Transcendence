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
import AuthSandbox from "./AuthSandbox"; // 1. Import de votre bac à sable

export default function App() {
  const { game, board, selected, handleSquareClick, resetGame, lastMove, isDragging, setIsDragging, handleDragStart, handleDragOver, handleDrop, capturedPieces, pendingPromotion, handlePromotionChoice } = useChessGame();
  const [is3D, setIs3D] = useState(false);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
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
              playerColor={game.turn() === 'w' ? 'w' : 'b'}
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
		  <button className="connexion-button">
			<img
    		src={connexionLogo}
    		alt="connexion"
    		className="connexion-logo"
  			/>
			Connexion
			</button>
          <button 
            onClick={resetGame}
            className="reset-board"
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
            className="button-switch-2d-3d"
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