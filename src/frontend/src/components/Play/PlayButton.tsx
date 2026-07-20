import { Swords } from "lucide-react";
import "../../styles/Play/PlayButton.css";

interface PlayButtonProps {
  label: string;
  onClick: () => void;
}

export function PlayButton({ label, onClick }: PlayButtonProps) {
  return (
    <button onClick={onClick} className="button-play-main">
      <Swords size={20} />
      <span className="button-play-main-labels">
        <span className="button-play-main-title">Jouer</span>
        <span className="button-play-main-subtitle">{label}</span>
      </span>
    </button>
  );
}