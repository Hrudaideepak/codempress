import React, { useState } from "react";
import Spinner from "./Spinner";
import { soundService } from "../../services/soundService";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "glowing" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  playSound?: boolean;
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
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  playSound = true,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    outline: "none",
    width: fullWidth ? "100%" : "auto",
    opacity: disabled || loading ? 0.5 : 1,
    transform: isHovered && !disabled && !loading ? "translateY(-2px)" : "none",
    boxShadow: isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.4)" : "none",
    position: "relative",
    overflow: "hidden"
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "8px 16px", fontSize: "13px", borderRadius: "10px" },
    md: { padding: "12px 24px", fontSize: "15px", borderRadius: "14px" },
    lg: { padding: "16px 32px", fontSize: "16px", borderRadius: "18px" }
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: isHovered && !disabled && !loading
        ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
        : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
      color: "#ffffff",
      boxShadow: isHovered && !disabled && !loading
        ? "0 8px 24px -4px rgba(99, 102, 241, 0.4)"
        : "0 4px 14px rgba(79, 70, 229, 0.25)"
    },
    glowing: {
      background: "linear-gradient(135deg, #6366F1 0%, #EC4899 50%, #8B5CF6 100%)",
      backgroundSize: "200% 200%",
      color: "#ffffff",
      boxShadow: isHovered && !disabled && !loading
        ? "0 10px 30px -4px rgba(236, 72, 153, 0.5)"
        : "0 4px 20px rgba(99, 102, 241, 0.3)"
    },
    accent: {
      background: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
      color: "#ffffff",
      boxShadow: isHovered && !disabled && !loading
        ? "0 8px 24px -4px rgba(16, 185, 129, 0.4)"
        : "0 4px 14px rgba(16, 185, 129, 0.2)"
    },
    secondary: {
      background: "#FFFFFF",
      border: "1.5px solid var(--border, #E2E8F0)",
      color: "var(--ink, #0F172A)"
    },
    ghost: {
      background: isHovered ? "rgba(99, 102, 241, 0.1)" : "transparent",
      color: "var(--primary, #8B5CF6)"
    },
    danger: {
      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      color: "#ffffff",
      boxShadow: isHovered && !disabled && !loading ? "0 8px 20px -4px rgba(239, 68, 68, 0.4)" : "none"
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (playSound && !disabled && !loading) {
      soundService.playPop();
    }
    if (onClick) onClick(e);
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
    ...style
  };

  return (
    <button
      disabled={disabled || loading}
      onClick={handleClick}
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
          color={variant === "secondary" || variant === "ghost" ? "var(--primary)" : "#ffffff"}
        />
      )}
      {!loading && leftIcon && <span style={{ display: "inline-flex" }}>{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span style={{ display: "inline-flex" }}>{rightIcon}</span>}
    </button>
  );
}
