import React from 'react';
import '../../styles/FindGame/ModeCard.css';

interface ModeCardProps {
  title: string;
  description: string;
  direction: 'up' | 'down';
  onClick: () => void;
  disabled?: boolean;
}

export function ModeCard({
  title,
  description,
  direction,
  onClick,
  disabled = false,
}: ModeCardProps) {
  const directionClass = direction === 'up' ? 'open-up' : 'open-down';

  return (
    <button 
      className={`mode-card ${directionClass}`} 
      onClick={onClick}
      disabled={disabled}
    >
      <div className="mode-info">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </button>
  );
}