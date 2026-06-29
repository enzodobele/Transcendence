// src/frontend/src/components/Board/Switch3DButton.tsx
import "../../styles/Board/Switch3DButton.css";

interface Switch3DButtonProps {
  is3D: boolean;
  setIs3D: (value: boolean) => void;
}

export function Switch3DButton({ is3D, setIs3D }: Switch3DButtonProps) {
  return (
    <button 
      onClick={() => setIs3D(!is3D)} 
      className={`button-switch-2d-3d ${is3D ? "is-3d" : "is-2d"}`}
    >
      {is3D ? "2D" : "3D"}
    </button>
  );
}