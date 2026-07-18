// src/frontend/src/components/Disconnect/DisconnectOverlay.tsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/Disconnect/DisconnectOverlay.css";

interface DisconnectionOverlayProps {
  isOpen: boolean;
  initialSeconds: number;
  onClaimVictory: () => void;
}

export const DisconnectionOverlay: React.FC<DisconnectionOverlayProps> = ({
  isOpen,
  initialSeconds,
  onClaimVictory,
}) => {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(initialSeconds);
      setCanClaim(false);
      return;
    }

    setSecondsLeft(initialSeconds);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClaim(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, initialSeconds]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="disconnection-overlay">
      <div className="disconnection-content">
        
        <div className="disconnection-header">
          <span style={{ color: "#ef4444" }}>⚠️</span>
          <h4 className="disconnection-title">{t("disconnect.title")}</h4>
        </div>

        <div className="disconnection-timer-row">
          <span>{t("disconnect.timeRemaining")}</span>
          <span className="disconnection-timer-countdown">
            {secondsLeft > 0 ? formatTime(secondsLeft) : t("disconnect.ready")}
          </span>
        </div>

        {canClaim ? (
          <button onClick={onClaimVictory} className="disconnection-claim-button">
            {t("disconnect.claimVictory")}
          </button>
        ) : (
          <div className="disconnection-wait-text">
            {t("disconnect.waitRequired")}
          </div>
        )}

      </div>
    </div>
  );
};