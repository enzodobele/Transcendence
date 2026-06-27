import React from "react";
import * as THREE from "three";

export const PlatformBase: React.FC = () => {
  return (
    <>
      {/* Base principale avec matériau élégant */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[9.2, 0.5, 9.2]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.2}
          roughness={0.4}
          envMapIntensity={1}
        />
      </mesh>

      {/* Bord supérieur beveled */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[9.4, 0.1, 9.4]} />
        <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.3} />
      </mesh>

      {/* Ombre sous la base */}
      <mesh position={[0, -0.55, 0]} receiveShadow>
        <boxGeometry args={[10, 0.05, 10]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Cadre décoratif */}
      {[
        { pos: [-4.9, -0.3, 0], args: [0.4, 0.6, 10.2] },
        { pos: [4.9, -0.3, 0], args: [0.4, 0.6, 10.2] },
        { pos: [0, -0.3, -4.9], args: [9.8, 0.6, 0.4] },
        { pos: [0, -0.3, 4.9], args: [9.8, 0.6, 0.4] },
      ].map((frame, idx) => {
        return (
          <mesh key={`frame-${idx}`} position={frame.pos as any}>
            <boxGeometry args={frame.args as any} />
            <meshStandardMaterial
              color="#000000"
              metalness={0.4}
              roughness={0.2}
            />
          </mesh>
        );
      })}
    </>
  );
};
