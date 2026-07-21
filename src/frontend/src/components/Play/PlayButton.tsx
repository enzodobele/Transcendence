import { Swords } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../styles/Play/PlayButton.css";

interface PlayButtonProps {
  label: string;
  onClick: () => void;
}

export function PlayButton({ label, onClick }: PlayButtonProps) {
  const { t } = useTranslation();
  return (
    <button onClick={onClick} className="button-play-main">
      <Swords size={20} />
      <span className="button-play-main-labels">
        <span className="button-play-main-title">{t("findGame.play")}</span>
        <span className="button-play-main-subtitle">{label}</span>
      </span>
    </button>
  );
}