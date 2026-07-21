import { useEffect } from "react";

// Celebratory banner shown when the user earns a new reward.
// `reward` is the new_reward object from an API response.
export default function RewardBanner({ reward, onClose }) {
  useEffect(() => {
    if (!reward) return;
    const t = setTimeout(() => onClose?.(), 6000);
    return () => clearTimeout(t);
  }, [reward, onClose]);

  if (!reward) return null;

  const message =
    reward.message || "You've unlocked a reward! Treat yourself, Deepak.";
  const amount = reward.amount != null ? `₹${reward.amount} treat` : "₹500 treat";

  return (
    <div className="reward-banner" role="alert">
      <div className="reward-glow" />
      <div className="reward-inner">
        <span className="reward-emoji">🎉</span>
        <div className="reward-text">
          <strong className="reward-title">{message}</strong>
          <span className="reward-amount">{amount}</span>
        </div>
        <button className="reward-close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}
