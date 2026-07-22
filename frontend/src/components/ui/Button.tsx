import React, { useState } from "react";
import Spinner from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Dynamic styling tokens based on custom theme variables
  const isDarkTheme = typeof window !== "undefined" && document.body.classList.contains("dark");

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "none",
    borderRadius: "14px",
    fontFamily: "var(--font)",
    fontWeight: 700,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    outline: "none",
    width: fullWidth ? "100%" : "auto",
    opacity: disabled || loading ? 0.5 : 1,
    transform: isHovered && !disabled && !loading ? "translateY(-1.5px)" : "none",
    boxShadow: isFocused ? "0 0 0 3px rgba(124, 58, 237, 0.4)" : "none",
  };

  // Size mapping
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "8px 16px", fontSize: "13px", borderRadius: "10px" },
    md: { padding: "12px 24px", fontSize: "15px", borderRadius: "14px" },
    lg: { padding: "16px 32px", fontSize: "16px", borderRadius: "18px" },
  };

  // Variant mapping
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: isHovered && !disabled && !loading
        ? "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)"
        : "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
      color: "#ffffff",
      boxShadow: isHovered && !disabled && !loading
        ? "0 6px 20px rgba(124, 58, 237, 0.25)"
        : "0 4px 14px rgba(124, 58, 237, 0.15)",
    },
    secondary: {
      background: "var(--bg-subtle)",
      border: "1px solid var(--border)",
      color: "var(--ink)",
    },
    ghost: {
      background: isHovered ? "rgba(124, 58, 237, 0.08)" : "transparent",
      color: "var(--primary)",
    },
    danger: {
      background: "#ef4444",
      color: "#ffffff",
      boxShadow: isHovered && !disabled && !loading ? "0 4px 12px rgba(239, 68, 68, 0.25)" : "none",
    },
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    if (onMouseEnter) onMouseEnter(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    if (onMouseLeave) onMouseLeave(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const mergedStyles: React.CSSProperties = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={mergedStyles}
      aria-busy={loading}
      aria-live={loading ? "assertive" : "off"}
      {...props}
    >
      {loading && (
        <Spinner
          size={size === "lg" ? "md" : "sm"}
          color={variant === "primary" || variant === "danger" ? "#ffffff" : "var(--primary)"}
        />
      )}
      {!loading && leftIcon && <span style={{ display: "inline-flex" }}>{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span style={{ display: "inline-flex" }}>{rightIcon}</span>}
    </button>
  );
}
