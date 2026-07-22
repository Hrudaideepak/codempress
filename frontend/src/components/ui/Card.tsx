import React, { useState } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
  clickable?: boolean;
  bordered?: boolean;
  glowOnHover?: boolean;
  padding?: string | number;
  background?: string;
  borderRadius?: string | number;
}

export default function Card({
  hoverLift = true,
  clickable = false,
  bordered = true,
  glowOnHover = true,
  padding = "24px",
  background = "#ffffff",
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

  const baseStyle: React.CSSProperties = {
    background,
    padding,
    borderRadius,
    border: bordered ? "1.5px solid var(--border)" : "none",
    boxShadow: isFocused
      ? "0 0 0 3px rgba(124, 58, 237, 0.3)"
      : isHovered && hoverLift && clickable
      ? "0 12px 30px rgba(124, 58, 237, 0.08)"
      : (style?.boxShadow || "0 4px 20px rgba(124, 58, 237, 0.02)"),
    cursor: clickable ? "pointer" : "default",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: isHovered && hoverLift && clickable ? "translateY(-3px)" : "none",
    outline: "none",
    borderColor: isFocused ? "var(--primary)" : (isHovered && glowOnHover && clickable ? "#ddd6fe" : "var(--border)"),
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
