import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export default function Spinner({ size = "md", color = "currentColor", className = "" }: SpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 40,
  };

  const currentSize = sizeMap[size];

  return (
    <svg
      className={`sf-spinner ${className}`}
      width={currentSize}
      height={currentSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="status"
      aria-label="Loading..."
      style={{
        animation: "sf-spin 0.8s linear infinite",
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="3"
      />
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12C2 13.5936 2.37232 15.1002 3.03306 16.4402"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <style>{`
        @keyframes sf-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}
