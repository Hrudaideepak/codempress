import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import HeroScene from "../HeroScene";
import { useToast } from "../ToastContext";
import { Card, Button } from "../components/ui";

function stars(n) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

export default function Subject() {
  const params = useParams();
  const rawCat = params.category || (typeof window !== "undefined" ? (window.location.pathname.split("/subject/")[1] || "").split("/")[0] : "");
  const decoded = decodeURIComponent(rawCat || "").trim();
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("map");
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 640 : false);

  useEffect(() => {
    if (!decoded) {
      navigate("/library", { replace: true });
      return;
    }
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [decoded, navigate]);

  useEffect(() => {
    api
      .getLibrary()
      .then((data) => {
        const cats = data?.categories || [];
        setCategories(cats);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, []);

  const cat = useMemo(() => {
    if (!categories.length || !decoded) return null;
    const target = decoded.toLowerCase();
    return categories.find((c) => c && c.name && c.name.trim().toLowerCase() === target) || null;
  }, [categories, decoded]);

  const openTopic = (topic) => {
    if (topic.locked) {
      toast.push("🔒 Locked — complete the previous topic to unlock.", "error");
      return;
    }
    navigate(`/topic/${topic.id}`);
  };

  const topics = cat
    ? [...(cat.topics || [])].sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    : [];

  return (
    <div className="container">
      <Link to="/library" className="back-link">
        ← All subjects
      </Link>

      <div className="hero">
        <HeroScene />
        <div className="hero-content">
          <h1>
            <span>{decoded || "Subject"}</span>
          </h1>
          <p>
            {cat
              ? `${cat.topic_count} topic${cat.topic_count === 1 ? "" : "s"} — read the theory, prove your understanding, and forge your path from Explorer to Legend.`
              : "Loading this subject's curriculum…"}
          </p>
        </div>
      </div>

      {status === "loading" && (
        <div className="state">
          <h2>Summoning the shelf…</h2>
        </div>
      )}

      {status === "error" && (
        <div className="state">
          <h2>The library is sealed</h2>
          <p>{error}</p>
        </div>
      )}

      {status === "ready" && !cat && (
        <div className="state">
          <h2>Subject not found</h2>
          <p>No curriculum exists for "{decoded}".</p>
        </div>
      )}

      {status === "ready" && cat && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px", gap: "10px" }}>
          <Button
            variant={viewMode === "map" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setViewMode("map")}
          >
            🗺️ Visual Path
          </Button>
          <Button
            variant={viewMode === "grid" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            ☰ Grid List
          </Button>
        </div>
      )}

      {status === "ready" && cat && viewMode === "grid" && (
        <div className="grid">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className={`card ${topic.locked ? "locked" : ""} ${
                topic.cleared ? "cleared" : ""
              }`}
              onClick={() => openTopic(topic)}
              title={
                topic.locked ? "Complete the previous topic to unlock" : ""
              }
            >
              <div className="card-top">
                <span className="level-tag">{topic.level_name}</span>
                {topic.locked ? (
                  <span className="lock-badge" title="Locked">
                    🔒
                  </span>
                ) : topic.cleared ? (
                  <span className="check-badge" title="Cleared">
                    ✓
                  </span>
                ) : (
                  <span className="difficulty">{stars(topic.difficulty)}</span>
                )}
              </div>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
              <div className="card-foot">
                <span className="xp-tag">+{topic.xp} XP</span>
                {topic.locked ? (
                  <span className="badge-locked">🔒 Locked</span>
                ) : topic.cleared ? (
                  <span className="badge-cleared">
                    ✓ Cleared
                    {typeof topic.mastery === "number" && (
                      <span className="mastery-pct"> {topic.mastery}%</span>
                    )}
                  </span>
                ) : (
                  <span className="badge-ready">● Ready</span>
                )}
              </div>
              {typeof topic.mastery === "number" && !topic.locked && (
                <div className="mastery-mini">
                  <div style={{ width: `${topic.mastery}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {status === "ready" && cat && viewMode === "map" && (
        <div className="skill-tree" style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
          padding: isMobile ? "20px 10px 20px 30px" : "40px 10px",
          margin: "0 auto",
          maxWidth: "800px"
        }}>
          {/* Central Connecting Road */}
          <div style={{
            position: "absolute",
            top: "40px",
            bottom: "40px",
            left: isMobile ? "20px" : "50%",
            transform: "translateX(-50%)",
            width: "6px",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
            opacity: 0.2,
            zIndex: 0,
            borderRadius: "3px"
          }} />

          {topics.map((topic, idx) => {
            const isLeft = isMobile ? false : idx % 2 === 0;
            const isLocked = topic.locked;
            const isCleared = topic.cleared;

            // Border color configuration
            const borderColor = isLocked
              ? "var(--border)"
              : isCleared
                ? "var(--success)"
                : "var(--primary)";

            const glowColor = isLocked
              ? "none"
              : isCleared
                ? "rgba(22, 163, 74, 0.15)"
                : "rgba(124, 58, 237, 0.15)";

            return (
              <div
                key={topic.id}
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: isLeft ? "flex-start" : "flex-end",
                  position: "relative",
                  zIndex: 1
                }}
              >
                {/* Node Center Milestone Circle */}
                <div style={{
                  position: "absolute",
                  left: isMobile ? "20px" : "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: isLocked ? "var(--bg-subtle)" : isCleared ? "var(--success)" : "var(--primary)",
                  border: `4px solid var(--bg-panel)`,
                  boxShadow: isLocked ? "none" : `0 0 12px ${isCleared ? "var(--success)" : "var(--primary)"}`,
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "bold"
                }}>
                  {isCleared ? "✓" : idx + 1}
                </div>

                {/* Snake Path Card element */}
                <Card
                  clickable
                  hoverLift={!isLocked}
                  onClick={() => openTopic(topic)}
                  style={{
                    width: isMobile ? "calc(100% - 40px)" : "42%",
                    padding: "24px",
                    borderRadius: "20px",
                    background: "var(--bg-panel)",
                    border: `1.5px solid ${borderColor}`,
                    boxShadow: glowColor,
                    opacity: isLocked ? 0.6 : 1,
                    textAlign: "left"
                  }}
                >
                  <div className="card-top" style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                    <span className="level-tag" style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "var(--bg-subtle)",
                      color: "var(--ink-soft)"
                    }}>{topic.level_name}</span>

                    {isLocked ? (
                      <span style={{ fontSize: "12px", color: "var(--ink-faint)" }}>🔒 Locked</span>
                    ) : isCleared ? (
                      <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 700 }}>✓ Mastered</span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700 }}>● Active</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink)", marginBottom: "8px" }}>
                    {topic.title}
                  </h3>
                  
                  <p style={{ fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: "16px" }}>
                    {topic.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)" }}>+{topic.xp} XP</span>
                    {!isLocked && typeof topic.mastery === "number" && (
                      <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontWeight: 500 }}>
                        Mastery: {topic.mastery}%
                      </span>
                    )}
                  </div>

                  {!isLocked && typeof topic.mastery === "number" && (
                    <div style={{
                      height: "6px",
                      background: "var(--bg-subtle)",
                      borderRadius: "3px",
                      overflow: "hidden",
                      marginTop: "12px"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${topic.mastery}%`,
                        background: isCleared ? "var(--success)" : "var(--primary)",
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
