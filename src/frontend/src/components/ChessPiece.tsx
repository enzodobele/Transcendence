import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { pieceConfig } from "../constants/pieceConfig";

interface ChessPieceProps {
  position: number[];
  type: string;
  color: string;
  square: string;
  onClick: (square: string, e: any) => void;
  isSelected: boolean;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({
  position,
  type,
  color,
  square,
  onClick,
  isSelected,
}) => {
  const config = pieceConfig[type] || pieceConfig.pawn;
  const { scene } = useGLTF(config.file);
  const meshRef = useRef<THREE.Mesh>(null);
  const [liftHeight, setLiftHeight] = useState(0);

  useFrame(() => {
    let targetHeight;
    if (isSelected) targetHeight = 0.5;
    else targetHeight = 0;
    setLiftHeight((prev) => prev + (targetHeight - prev) * 0.1);
  });

  // Calcule la position finale avec l'offset
  const finalPosition = [
    position[0] + (config.positionOffset[0] || 0),
    position[1] + (config.positionOffset[1] || 0) + liftHeight,
    position[2] + (config.positionOffset[2] || 0),
  ];

  // Rotation des pièces
  let rotation = config.rotation;

  if (type === "knight" && color === "black") {
    rotation = [
      config.rotation[0],
      config.rotation[1],
      config.rotation[2] + Math.PI,
    ];
  }

  // Récupère le premier mesh trouvé (approche simple)
  let mesh: any = null;

  scene.traverse((obj: any) => {
    if (!mesh && obj.isMesh) mesh = obj;
  });

  if (mesh) {
    const clonedMesh = mesh.clone();

    // Applique la couleur et améliore le matériau selon le type de pièce
    clonedMesh.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        obj.material = obj.material.clone();

        if (color === "black") {
          obj.material.color.set("#717171");
        } else {
          obj.material.color.set("#e2e2e2");
        }

        // Améliore le rendu : moins rugueux, plus métallique
        obj.material.metalness = 0.4;
        obj.material.roughness = 0.3;
        obj.material.emissive.setHex(0x000000);
        //obj.material.needsUpdate = true;
      }
    });

    return (
      <primitive
        ref={meshRef}
        object={clonedMesh}
        position={finalPosition as any}
        scale={[config.scale, config.scale, config.scale]}
        rotation={rotation as any}
        onClick={(e: any) => {
          e.stopPropagation();
          onClick(square, e);
        }}
      />
    );
  }

  // Fallback: sphères si rien trouvé
  let fallbackColor = "#000000";

  if (color === "white") fallbackColor = "#ffffff";

  return (
    <mesh
      position={position as any}
      onClick={(e: any) => {
        e.stopPropagation();
        onClick(square, e);
      }}
    >
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color={fallbackColor} />
    </mesh>
  );
};
