import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import HeroScene from "../HeroScene";

function Stat({ label, value, icon }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function levelFromXp(xp) {
  // Explorer(0) -> Apprentice(1) -> Journeyman(2) -> Master(3) -> Architect(4) -> Legend(5)
  const thresholds = [0, 500, 1500, 3500, 7000, 12000];
  let lvl = 0;
  for (let i = 0; i < thresholds.length; i++) if (xp >= thresholds[i]) lvl = i;
  const cur = thresholds[lvl];
  const next = thresholds[lvl + 1] ?? thresholds[lvl];
  const pct = next > cur ? Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100)) : 100;
  const names = ["Explorer", "Apprentice", "Journeyman", "Master", "Architect", "Legend"];
  return { level: lvl, name: names[lvl], pct, toNext: Math.max(0, next - xp) };
}

export default function Profile() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState("loading");
  const [specialCode, setSpecialCode] = useState(() => localStorage.getItem("sf_special_code") || "");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (codeInput.trim() === "IAmInevitable") {
      localStorage.setItem("sf_special_code", "IAmInevitable");
      setSpecialCode("IAmInevitable");
      setCodeError("");
    } else {
      setCodeError("Invalid special code");
    }
  };

  useEffect(() => {
    let alive = true;
    Promise.all([api.getProgress(), api.getRewards(), api.getMe().catch(() => null)])
      .then(([p, r, m]) => {
        if (!alive) return;
        setProgress(p);
        setRewards(r);
        setMe(m);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  const lvl = useMemo(
    () => levelFromXp(progress?.total_xp || 0),
    [progress]
  );

  // group mastery by category
  const byCategory = useMemo(() => {
    if (!progress?.topics) return [];
    const map = {};
    for (const t of progress.topics) {
      const c = t.category || "Other";
      if (!map[c]) map[c] = { category: c, sum: 0, count: 0 };
      map[c].sum += t.mastery_percent || 0;
      map[c].count += 1;
    }
    return Object.values(map)
      .map((g) => ({ ...g, avg: Math.round(g.sum / g.count) }))
      .sort((a, b) => b.avg - a.avg);
  }, [progress]);

  if (status === "loading") {
    return (
      <div className="container">
        <div className="state">
          <h2>Summoning your dashboard…</h2>
        </div>
      </div>
    );
  }

  const name = me?.name || user?.name || "Coder";
  const email = me?.email || user?.email || "";
  const avatar = me?.avatar_url || user?.avatar_url;
  const cleared = rewards?.total_cleared || 0;
  const topics = progress?.topics || [];
  const readCount = topics.filter((t) => t.theory_read).length;

  return (
    <div className="container">
      <Link to="/library" className="back-link">
        ← All subjects
      </Link>

      <div className="profile-header">
        <div className="profile-avatar">
          {avatar ? (
            <img src={avatar} alt="" />
          ) : (
            <span className="avatar-fallback">{name?.[0] || "?"}</span>
          )}
        </div>
        <div className="profile-id">
          <h1>{name}</h1>
          {email && <p className="profile-email">{email}</p>}
          <div className="level-badge">
            Level {lvl.level} · {lvl.name}
          </div>
        </div>
        <div className="profile-xp">
          <div className="big-xp">{(progress?.total_xp || 0).toLocaleString()} XP</div>
          <div className="xp-sub">{lvl.toNext.toLocaleString()} XP to next level</div>
          <div className="progress-bar wide">
            <div className="progress-fill" style={{ width: `${lvl.pct}%` }} />
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Total XP" value={(progress?.total_xp || 0).toLocaleString()} icon="✦" />
        <Stat label="Current Streak" value={`${progress?.current_streak || 0} 🔥`} icon="⚡" />
        <Stat label="Longest Streak" value={`${progress?.longest_streak || 0} 🔥`} icon="🏆" />
        <Stat label="Topics Cleared" value={cleared} icon="✓" />
        <Stat label="Theory Read" value={`${readCount}/${topics.length}`} icon="📖" />
        <Stat label="To Next Milestone" value={rewards?.topics_to_next || 0} icon="🎯" />
      </div>

      <div className="section-head">
        <h2>Mastery by Subject</h2>
        <span className="count">{byCategory.length} subjects</span>
      </div>
      <div className="mastery-list">
        {byCategory.length === 0 && <p className="muted">No progress yet — start a topic!</p>}
        {byCategory.map((g) => (
          <div className="mastery-row" key={g.category}>
            <span className="mastery-name">{g.category}</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${g.avg}%` }} />
            </div>
            <span className="mastery-pct">{g.avg}%</span>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h2>Rewards & Milestones</h2>
        <span className="count">
          {cleared}/{rewards?.next_milestone || 0} cleared
        </span>
      </div>
      <div className="reward-card">
        <div className="reward-progress">
          <div className="progress-bar wide">
            <div
              className="progress-fill"
              style={{
                width: `${specialCode === "IAmInevitable" ? 100 : (rewards ? Math.min(100, (cleared / (rewards.next_milestone || 1)) * 100) : 0)}%`,
              }}
            />
          </div>
          <p className="muted">
            {specialCode === "IAmInevitable" ? (
              <strong style={{ color: "var(--accent)" }}>0 more to your next ₹500 treat 🎉</strong>
            ) : (
              `${rewards?.topics_to_next || 0} more topics to your next ₹500 treat 🎉`
            )}
          </p>
        </div>
        {specialCode !== "IAmInevitable" && (
          <form onSubmit={handleCodeSubmit} style={{ marginTop: "15px", display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Enter special code..."
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "var(--foreground)",
                fontFamily: "Space Mono, monospace",
                fontSize: "14px",
                flexGrow: 1
              }}
            />
            <button type="submit" className="btn btn-ghost" style={{ padding: "8px 16px" }}>
              Unlock
            </button>
          </form>
        )}
        {codeError && <p className="error-msg" style={{ color: "#EF4444", fontSize: "12px", marginTop: "5px" }}>{codeError}</p>}
        {rewards?.rewards?.length > 0 && (
          <ul className="reward-history">
            {rewards.rewards.map((rw, i) => (
              <li key={i}>
                <span className="reward-amt">₹{rw.amount}</span>
                <span>{rw.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="cta-row">
        <Link to="/library" className="btn btn-primary">
          Continue Learning
        </Link>
      </div>
    </div>
  );
}
