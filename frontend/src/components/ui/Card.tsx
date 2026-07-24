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

  const defaultBg = "#FFFFFF";

  const baseStyle: React.CSSProperties = {
    background: background || defaultBg,
    padding,
    borderRadius,
    border: bordered ? "1px solid #E2E8F0" : "none",
    boxShadow: isFocused
      ? "0 0 0 3px rgba(124, 58, 237, 0.2)"
      : isHovered && hoverLift && clickable
      ? "0 16px 36px -4px rgba(15, 23, 42, 0.08)"
      : (style?.boxShadow || "0 4px 20px -2px rgba(15, 23, 42, 0.05)"),
    cursor: clickable ? "pointer" : "default",
    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    transform: isHovered && hoverLift && clickable ? "translateY(-4px)" : "none",
    outline: "none",
    borderColor: isFocused
      ? "var(--primary, #7C3AED)"
      : isHovered && glowOnHover && clickable
      ? "#DDD6FE"
      : "#E2E8F0",
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
