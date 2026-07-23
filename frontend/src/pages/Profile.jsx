import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { Card } from "../components/ui";
import { Flame, Award, BookOpen, CheckCircle2, Trophy, Star, ArrowLeft, LogOut } from "lucide-react";

const LEVEL_NAMES = ["Explorer", "Apprentice", "Journeyman", "Master", "Architect", "Legend"];

function getLevelInfo(xp) {
  const level = Math.min(5, Math.floor(xp / 100));
  const currentLevelName = LEVEL_NAMES[level];
  const nextLevelName = LEVEL_NAMES[Math.min(5, level + 1)];
  const xpInCurrentLevel = xp % 100;
  const xpNeededForNext = level >= 5 ? 0 : 100 - xpInCurrentLevel;
  return { level, currentLevelName, nextLevelName, xpNeededForNext, progress: level >= 5 ? 100 : xpInCurrentLevel };
}

function Stat({ label, value, icon: Icon, color }) {
  return (
    <Card style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}>
      <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: color || "var(--bg-subtle)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon size={22} color={color ? "#ffffff" : "var(--primary)"} />
      </div>
      <div>
        <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--ink)" }}>{value}</div>
        <div style={{ fontSize: "13px", color: "var(--ink-soft)", fontWeight: 600 }}>{label}</div>
      </div>
    </Card>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [profileUser, setProfileUser] = useState(user);
  const [subjects, setSubjects] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    // Fetch latest fresh user stats
    api.getMe()
      .then((freshUser) => {
        setProfileUser(freshUser);
      })
      .catch((err) => {
        console.error("Failed to load fresh user data:", err);
      });

    // Fetch subject progress details
    api.getSubjects()
      .then((data) => {
        setSubjects(data.subjects || []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const totalMastered = subjects.reduce((sum, s) => sum + (s.mastered_topics || 0), 0);
  const xp = profileUser?.xp || 0;
  const streak = profileUser?.streak_count || 0;

  const { level, currentLevelName, nextLevelName, xpNeededForNext, progress } = getLevelInfo(xp);

  // Motivational message
  const getStreakMessage = () => {
    if (streak === 0) return "Start a learning path to begin your streak!";
    if (streak <= 2) return "Keep it up! Consistency is key.";
    if (streak <= 6) return "Warm streak! You are building a daily habit.";
    return "Super Saiyan! Unstoppable daily momentum.";
  };

  const achievements = [
    {
      id: "first_step",
      title: "First Step",
      description: "Earned your first computer science XP.",
      icon: Star,
      unlocked: xp > 0,
      color: "#f59e0b"
    },
    {
      id: "road_warrior",
      title: "Streak Warrior",
      description: "Maintained a 3+ day learning streak.",
      icon: Flame,
      unlocked: streak >= 3,
      color: "#ef4444"
    },
    {
      id: "master_class",
      title: "Topic Conqueror",
      description: "Mastered your first topic quiz (60%+ score).",
      icon: CheckCircle2,
      unlocked: totalMastered >= 1,
      color: "#22c55e"
    },
    {
      id: "polymath",
      title: "Polymath Explorer",
      description: "Mastered 5 topics across the curriculum.",
      icon: Trophy,
      unlocked: totalMastered >= 5,
      color: "#a855f7"
    },
    {
      id: "legendary",
      title: "Legendary Coder",
      description: "Reached Legend status (500+ XP).",
      icon: Award,
      unlocked: xp >= 500,
      color: "#3b82f6"
    }
  ];

  return (
    <div className="container">
      <Link to="/library" className="back-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <ArrowLeft size={16} />
        <span>Back to Command Center</span>
      </Link>

      {/* User Header Profile Card */}
      <div style={{
        background: "linear-gradient(135deg, var(--bg-panel) 0%, var(--bg-subtle) 100%)",
        border: "1.5px solid var(--border)",
        borderRadius: "28px",
        padding: "36px",
        marginBottom: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 10px 40px rgba(124,58,237,0.04)",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {profileUser?.picture ? (
            <img
              src={profileUser.picture}
              alt={profileUser.name}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                border: "2px solid var(--primary)",
                objectFit: "cover"
              }}
            />
          ) : (
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontSize: "28px",
              fontWeight: 800
            }}>
              {profileUser?.name?.[0] || "U"}
            </div>
          )}

          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              {profileUser?.name || "User Profile"}
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", margin: "4px 0 8px 0" }}>
              {profileUser?.email || "user@example.com"}
            </p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--bg-subtle)",
              color: "var(--primary)",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase"
            }}>
              <Star size={14} fill="var(--primary)" />
              <span>Level {level} · {currentLevelName}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--primary)" }}>{xp} XP</div>
          {level >= 5 ? (
            <div style={{ fontSize: "13px", color: "var(--success)", fontWeight: 600 }}>Max Level Reached 🏆</div>
          ) : (
            <div style={{ fontSize: "13px", color: "var(--ink-soft)", fontWeight: 600 }}>
              {xpNeededForNext} XP to {nextLevelName}
            </div>
          )}
          <div style={{
            height: "8px",
            background: "var(--bg-subtle)",
            borderRadius: "4px",
            width: "180px",
            overflow: "hidden",
            marginTop: "8px",
            display: "inline-block"
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--primary)",
              transition: "width 0.3s ease"
            }} />
          </div>
          <div style={{ marginTop: "14px" }}>
            <button
              onClick={logout}
              className="logout-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "12px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1.5px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              title="Sign out of your Codempress account"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <Stat label="Total XP Earned" value={`${xp} XP`} icon={Star} />
        <Stat label="Active Streak" value={`${streak} Day${streak === 1 ? "" : "s"} 🔥`} icon={Flame} />
        <Stat label="Topics Mastered" value={totalMastered} icon={CheckCircle2} />
        <Stat label="Subjects Enrolled" value={subjects.length} icon={BookOpen} />
      </div>

      {/* Streak Alert box */}
      <div style={{
        background: "rgba(239, 68, 68, 0.05)",
        border: "1.5px dashed rgba(239, 68, 68, 0.2)",
        borderRadius: "20px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "40px"
      }}>
        <div style={{ fontSize: "28px" }}>🔥</div>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>Daily Habit Tracker</h4>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--ink-soft)" }}>{getStreakMessage()}</p>
        </div>
      </div>

      {/* Achievements Systems */}
      <div className="section-head" style={{ marginBottom: "20px" }}>
        <h2>Unlocked Achievements</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "40px" }}>
        {achievements.map((ach) => {
          const Icon = ach.icon;
          return (
            <Card
              key={ach.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "20px",
                opacity: ach.unlocked ? 1 : 0.4,
                border: ach.unlocked ? `1.5px solid ${ach.color}` : "1.5px solid var(--border)",
                background: ach.unlocked ? "var(--bg-panel)" : "rgba(0,0,0,0.01)"
              }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: ach.unlocked ? ach.color : "var(--border)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0
              }}>
                <Icon size={24} color="#ffffff" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, color: "var(--ink)" }}>{ach.title}</h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--ink-soft)" }}>{ach.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Subject Mastery Progress Breakdown */}
      <div className="section-head" style={{ marginBottom: "20px" }}>
        <h2>Subject Mastery Breakdown</h2>
        <span className="count">{subjects.length} Subjects</span>
      </div>

      {status === "loading" && (
        <div className="state">
          <h3>Loading subject progress metrics…</h3>
        </div>
      )}

      {status === "error" && (
        <div className="state">
          <h3>Failed to load subject statistics.</h3>
        </div>
      )}

      {status === "ready" && subjects.length === 0 && (
        <div className="state">
          <h3>No enrolled subjects found. Complete a topic to enroll!</h3>
        </div>
      )}

      {status === "ready" && subjects.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {subjects.map((sub) => (
            <Card key={sub.name} style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>{sub.name}</span>
                <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: "14px" }}>
                  {sub.mastered_topics} / {sub.total_topics} Mastered
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px" }}>
                <span>Syllabus Progress</span>
                <span>{sub.mastery_percent}% Mastery</span>
              </div>
              <div style={{
                height: "8px",
                background: "var(--bg-subtle)",
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${sub.mastery_percent}%`,
                  background: sub.mastery_percent >= 60 ? "var(--success)" : "var(--primary)",
                  transition: "width 0.3s ease"
                }} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
