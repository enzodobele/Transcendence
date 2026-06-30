import { type LucideIcon } from "lucide-react";
import '../../styles/FindGame/ModeCard.css';

interface ModeCardProps {
  title: string;
  description: string;
  direction: 'up' | 'down';
  onClick: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
}

export function ModeCard({
  title,
  description,
  direction,
  onClick,
  disabled = false,
  icon: Icon,
}: ModeCardProps) {
  const directionClass = direction === 'up' ? 'open-up' : 'open-down';

  return (
    <button
      className={`mode-card ${directionClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={28} className="mode-card-icon" />}
      <div className="mode-info">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </button>
  );
}