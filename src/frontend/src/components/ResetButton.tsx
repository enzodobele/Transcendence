import React from "react";

interface ResetButtonProps {
  onClick: () => void;
}

export const ResetButton: React.FC<ResetButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        cursor: "pointer",
      }}
    >
      Réinitialiser
    </button>
  );
};
