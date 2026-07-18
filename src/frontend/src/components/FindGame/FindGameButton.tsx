import { LayoutGrid } from "lucide-react";
import "../../styles/FindGame/FindGameButton.css";

interface FindGameButtonProps {
  onClick: () => void;
}

export function FindGameButton({ onClick }: FindGameButtonProps) {
  return (
    <button onClick={onClick} className="button-find-game" title="Autres modes de jeu">
      <LayoutGrid size={18} />
    </button>
  );
}
