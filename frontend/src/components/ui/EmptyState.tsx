import React from "react";
import Button from "./Button";
import { Info } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  actionVariant?: "primary" | "secondary" | "ghost" | "danger";
}

export default function EmptyState({
  title,
  description,
  icon = <Info size={32} color="var(--primary)" />,
  actionText,
  onAction,
  actionLoading = false,
  actionVariant = "primary",
}: EmptyStateProps) {
  return (
    <div
      className="sf-empty-state"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        background: "#ffffff",
        border: "1.5px dashed var(--border)",
        borderRadius: "20px",
        maxWidth: "480px",
        margin: "24px auto",
      }}
    >
      {/* Icon Area */}
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "var(--primary-soft)",
          display: "grid",
          placeItems: "center",
          marginBottom: "18px",
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "var(--ink)",
          marginBottom: "8px",
          fontFamily: "var(--font-heading)",
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: "14px",
            color: "var(--ink-soft)",
            lineHeight: 1.5,
            marginBottom: actionText && onAction ? "20px" : 0,
            maxWidth: "320px",
            fontFamily: "var(--font-content)",
          }}
        >
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionText && onAction && (
        <Button
          variant={actionVariant}
          size="sm"
          onClick={onAction}
          loading={actionLoading}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
