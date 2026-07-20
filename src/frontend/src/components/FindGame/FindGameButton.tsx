import { LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../styles/FindGame/FindGameButton.css";

interface FindGameButtonProps {
  onClick: () => void;
}

export function FindGameButton({ onClick }: FindGameButtonProps) {
  const { t } = useTranslation();
  return (
    <button onClick={onClick} className="button-find-game" title={t("findGame.otherModes")}>
      <LayoutGrid size={18} />
    </button>
  );
}
