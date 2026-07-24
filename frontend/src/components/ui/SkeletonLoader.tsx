import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  borderRadius
}) => {
  const style: React.CSSProperties = {
    width: width !== undefined ? width : "100%",
    height: height !== undefined ? height : "1rem",
    borderRadius: borderRadius !== undefined ? borderRadius : "8px"
  };

  return <div className={`skeleton-shimmer ${className}`} style={style} aria-hidden="true" />;
};

export const CardSkeleton: React.FC = () => (
  <div className="glass-card skeleton-card">
    <div className="skeleton-header">
      <Skeleton width="40px" height="40px" borderRadius="10px" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height="20px" />
        <Skeleton width="40%" height="14px" style={{ marginTop: "6px" }} />
      </div>
    </div>
    <div style={{ margin: "16px 0" }}>
      <Skeleton width="100%" height="14px" />
      <Skeleton width="90%" height="14px" style={{ marginTop: "8px" }} />
    </div>
    <div className="skeleton-footer">
      <Skeleton width="80px" height="28px" borderRadius="999px" />
      <Skeleton width="100px" height="28px" borderRadius="999px" />
    </div>
  </div>
);

export const QuizSkeleton: React.FC = () => (
  <div className="quiz-container glass-panel">
    <Skeleton width="30%" height="14px" style={{ marginBottom: "20px" }} />
    <Skeleton width="80%" height="28px" style={{ marginBottom: "16px" }} />
    <Skeleton width="100%" height="16px" style={{ marginBottom: "10px" }} />
    <Skeleton width="95%" height="16px" style={{ marginBottom: "30px" }} />
    
    <div className="quiz-options">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} width="100%" height="56px" borderRadius="12px" style={{ marginBottom: "12px" }} />
      ))}
    </div>
  </div>
);

export default Skeleton;
