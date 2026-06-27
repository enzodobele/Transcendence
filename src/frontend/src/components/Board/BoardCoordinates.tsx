import React from "react";
import { Text } from "@react-three/drei";
import { FILES, RANKS } from "../../constants/boardConstants";

export const BoardCoordinates: React.FC = () => {
  const coordinateSize = 0.4;

  return (
    <>
      {/* Lettres (a-h) en bas */}
      {FILES.map((file, x) => {
        return (
          <Text
            key={`file-${file}`}
            position={[x - 3.5, 0.01, -4.4]}
            fontSize={coordinateSize}
            color="#333333"
            anchorX="center"
            anchorY="middle"
            rotation={[Math.PI / 2, 3.15, 0]}
          >
            {file.toUpperCase()}
          </Text>
        );
      })}

      {/* Lettres (a-h) en haut */}
      {FILES.map((file, x) => {
        return (
          <Text
            key={`file-top-${file}`}
            position={[x - 3.5, 0.001, 4.35]}
            fontSize={coordinateSize}
            color="#333333"
            anchorX="center"
            anchorY="middle"
            rotation={[Math.PI / 2, 3.15, Math.PI]}
          >
            {file.toUpperCase()}
          </Text>
        );
      })}

      {/* Chiffres (8-1) à gauche */}
      {RANKS.map((rank, z) => {
        return (
          <Text
            key={`rank-left-${rank}`}
            position={[-4.4, 0.005, z - 3.5]}
            fontSize={coordinateSize}
            color="#333333"
            anchorX="center"
            anchorY="middle"
            rotation={[Math.PI / 2, 3.15, Math.PI / 1]}
          >
            {rank}
          </Text>
        );
      })}

      {/* Chiffres (8-1) à droite */}
      {RANKS.map((rank, z) => {
        return (
          <Text
            key={`rank-right-${rank}`}
            position={[4.4, 0.001, z - 3.5]}
            fontSize={coordinateSize}
            color="#333333"
            anchorX="center"
            anchorY="middle"
            rotation={[Math.PI / 2, 3.15, -Math.PI / 1]}
          >
            {rank}
          </Text>
        );
      })}
    </>
  );
};
