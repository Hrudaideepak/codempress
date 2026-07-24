import React, { useState } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
  clickable?: boolean;
  bordered?: boolean;
  glowOnHover?: boolean;
  glass?: boolean;
  padding?: string | number;
  background?: string;
  borderRadius?: string | number;
}

export default function Card({
  hoverLift = true,
  clickable = false,
  bordered = true,
  glowOnHover = true,
  glass = true,
  padding = "24px",
  background,
  borderRadius = "20px",
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const defaultBg = glass
    ? "rgba(17, 24, 39, 0.7)"
    : "var(--bg-panel, #1F2937)";

  const baseStyle: React.CSSProperties = {
    background: background || defaultBg,
    padding,
    borderRadius,
    border: bordered ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
    backdropFilter: glass ? "blur(16px)" : "none",
    WebkitBackdropFilter: glass ? "blur(16px)" : "none",
    boxShadow: isFocused
      ? "0 0 0 3px rgba(99, 102, 241, 0.4)"
      : isHovered && hoverLift && clickable
      ? "0 12px 32px -4px rgba(99, 102, 241, 0.25)"
      : (style?.boxShadow || "0 4px 20px rgba(0, 0, 0, 0.2)"),
    cursor: clickable ? "pointer" : "default",
    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    transform: isHovered && hoverLift && clickable ? "translateY(-4px)" : "none",
    outline: "none",
    borderColor: isFocused
      ? "var(--primary, #8B5CF6)"
      : isHovered && glowOnHover && clickable
      ? "rgba(139, 92, 246, 0.4)"
      : "rgba(255, 255, 255, 0.08)",
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    if (onMouseEnter) onMouseEnter(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    if (onMouseLeave) onMouseLeave(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    if (clickable) setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (clickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      props.onClick?.(e as any);
    }
    if (onKeyDown) onKeyDown(e);
  };

  const mergedStyles: React.CSSProperties = {
    ...baseStyle,
    ...style,
  };

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={mergedStyles}
      {...props}
    >
      {children}
    </div>
  );
}
