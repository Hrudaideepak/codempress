import React from "react";
import Button from "./Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
  compact?: boolean;
}

export default function ErrorState({
  title = "Something went wrong",
  description = "Unable to load data at this time. Please verify your network connection and try again.",
  onRetry,
  retryText = "Try Again",
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      className="sf-error-state"
      role="alert"
      aria-live="assertive"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: compact ? "24px 16px" : "40px 24px",
        background: "rgba(239, 68, 68, 0.04)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        borderRadius: "16px",
        maxWidth: compact ? "100%" : "480px",
        margin: compact ? "12px 0" : "24px auto",
      }}
    >
      <div
        style={{
          width: compact ? "44px" : "56px",
          height: compact ? "44px" : "56px",
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.12)",
          display: "grid",
          placeItems: "center",
          marginBottom: compact ? "12px" : "16px",
          color: "#EF4444",
        }}
      >
        <AlertTriangle size={compact ? 22 : 28} />
      </div>

      <h3
        style={{
          fontSize: compact ? "16px" : "18px",
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 8px 0",
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            margin: "0 0 16px 0",
            lineHeight: 1.5,
            maxWidth: "380px",
          }}
        >
          {description}
        </p>
      )}

      {onRetry && (
        <Button variant="secondary" onClick={onRetry} style={{ gap: "8px" }}>
          <RefreshCw size={16} />
          {retryText}
        </Button>
      )}
    </div>
  );
}
