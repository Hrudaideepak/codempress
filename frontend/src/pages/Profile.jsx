import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { Flame, Award, BookOpen, CheckCircle2, Trophy, Star, ArrowLeft, LogOut, Shield, Compass, Trash2, Rocket, ChevronRight } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { STATIC_ROADMAPS } from "../data/staticRoadmaps";

const LEVEL_NAMES = ["Explorer", "Apprentice", "Journeyman", "Master", "Architect", "Legend"];

function getLevelInfo(xp) {
  const level = Math.min(5, Math.floor(xp / 100));
  const currentLevelName = LEVEL_NAMES[level];
  const nextLevelName = LEVEL_NAMES[Math.min(5, level + 1)];
  const xpInCurrentLevel = xp % 100;
  const xpNeededForNext = level >= 5 ? 0 : 100 - xpInCurrentLevel;
  return { level, currentLevelName, nextLevelName, xpNeededForNext, progress: level >= 5 ? 100 : xpInCurrentLevel };
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [profileUser, setProfileUser] = useState(user);
  const [subjects, setSubjects] = useState([]);
  const [status, setStatus] = useState("loading");
  const [enrolledSlugs, setEnrolledSlugs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sf_enrolled_roadmaps")) || [];
    } catch {
      return [];
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    api
      .getMe()
      .then((freshUser) => {
        setProfileUser(freshUser);
      })
      .catch((err) => {
        console.error("Failed to load fresh user data:", err);
      });

    api
      .getSubjects()
      .then((data) => {
        setSubjects(data.subjects || []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));

    api
      .getEnrollments()
      .then((res) => {
        if (res && res.enrolled_roadmaps) {
          setEnrolledSlugs(res.enrolled_roadmaps);
          localStorage.setItem("sf_enrolled_roadmaps", JSON.stringify(res.enrolled_roadmaps));
        }
      })
      .catch(() => {});
  }, []);

  const handleUnenrollRoadmap = (slug) => {
    const next = enrolledSlugs.filter((s) => s !== slug);
    setEnrolledSlugs(next);
    localStorage.setItem("sf_enrolled_roadmaps", JSON.stringify(next));
    api.toggleEnrollment("roadmap", slug).catch(() => {});
  };

  const myEnrolledRoadmaps = STATIC_ROADMAPS.filter((r) => enrolledSlugs.includes(r.slug));

  const totalMastered = subjects.reduce((sum, s) => sum + (s.mastered_topics || 0), 0);
  const xp = profileUser?.xp || 0;
  const streak = profileUser?.streak_count || 0;

  const { level, currentLevelName, nextLevelName, xpNeededForNext, progress } = getLevelInfo(xp);

  const achievements = [
    {
      id: "first_step",
      title: "First Step",
      description: "Earned your first computer science XP.",
      icon: Star,
      unlocked: xp > 0,
      color: "#FBBF24"
    },
    {
      id: "road_warrior",
      title: "Streak Warrior",
      description: "Maintained a 3+ day learning streak.",
      icon: Flame,
      unlocked: streak >= 3,
      color: "#EF4444"
    },
    {
      id: "master_class",
      title: "Topic Conqueror",
      description: "Mastered your first topic quiz.",
      icon: CheckCircle2,
      unlocked: totalMastered >= 1,
      color: "#34D399"
    },
    {
      id: "polymath",
      title: "Polymath Explorer",
      description: "Mastered 5 topics across curriculum.",
      icon: Trophy,
      unlocked: totalMastered >= 5,
      color: "#C084FC"
    },
    {
      id: "legendary",
      title: "Legendary Coder",
      description: "Reached Legend status (500+ XP).",
      icon: Award,
      unlocked: xp >= 500,
      color: "#60A5FA"
    }
  ];

  return (
    <div style={{ paddingBottom: "64px" }}>
      <button
        onClick={() => navigate("/library")}
        style={{
          background: "none",
          border: "none",
          color: "var(--ink-soft)",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        <ArrowLeft size={16} /> Back to Library
      </button>

      {/* User Header Profile Card */}
      <Card glass padding="32px" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {profileUser?.picture ? (
              <img
                src={profileUser.picture}
                alt={profileUser.name}
                className="user-avatar"
                style={{ width: "72px", height: "72px" }}
              />
            ) : (
              <div
                className="user-avatar fallback"
                style={{ width: "72px", height: "72px", fontSize: "28px" }}
              >
                {profileUser?.name?.[0] || "U"}
              </div>
            )}

            <div>
              <h1 style={{ fontSize: "28px", color: "#0F172A", marginBottom: "4px" }}>
                {profileUser?.name || "Software Engineer"}
              </h1>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "8px" }}>
                {profileUser?.email || "user@codempress.ai"}
              </p>
              <div className="pill xp">
                <Star size={14} fill="#C084FC" />
                <span>Level {level} • {currentLevelName}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--primary)" }}>{xp} XP</div>
            <div style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "4px" }}>
              {level >= 5 ? "Max Level Reached 🏆" : `${xpNeededForNext} XP to ${nextLevelName}`}
            </div>
            <div className="progress-bar-bg" style={{ width: "200px", marginTop: "8px" }}>
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ marginTop: "16px" }}>
              <Button variant="danger" size="sm" onClick={logout} leftIcon={<LogOut size={14} />}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Metrics Grid */}
      <div className="profile-stats-grid" style={{ marginBottom: "32px" }}>
        <Card glass className="stat-card">
          <Star size={24} color="#C084FC" style={{ margin: "0 auto 8px" }} />
          <div className="stat-num">{xp}</div>
          <div style={{ color: "var(--ink-soft)", fontSize: "13px", fontWeight: 600 }}>Total XP</div>
        </Card>

        <Card glass className="stat-card">
          <Flame size={24} color="#FBBF24" style={{ margin: "0 auto 8px" }} />
          <div className="stat-num">{streak}</div>
          <div style={{ color: "var(--ink-soft)", fontSize: "13px", fontWeight: 600 }}>Active Streak Days</div>
        </Card>

        <Card glass className="stat-card">
          <CheckCircle2 size={24} color="#34D399" style={{ margin: "0 auto 8px" }} />
          <div className="stat-num">{totalMastered}</div>
          <div style={{ color: "var(--ink-soft)", fontSize: "13px", fontWeight: 600 }}>Topics Mastered</div>
        </Card>

        <Card glass className="stat-card">
          <BookOpen size={24} color="#60A5FA" style={{ margin: "0 auto 8px" }} />
          <div className="stat-num">{subjects.length}</div>
          <div style={{ color: "var(--ink-soft)", fontSize: "13px", fontWeight: 600 }}>Subjects Enrolled</div>
        </Card>
      </div>

      {/* Achievement Badges */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "22px", color: "#0F172A", marginBottom: "16px" }}>Achievement Badges</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {achievements.map((ach) => {
            const Icon = ach.icon;
            return (
              <Card
                key={ach.id}
                glass
                padding="20px"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  opacity: ach.unlocked ? 1 : 0.4,
                  borderColor: ach.unlocked ? ach.color : "var(--border)"
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: ach.unlocked ? ach.color : "#F1F5F9",
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <Icon size={22} color={ach.unlocked ? "#ffffff" : "#94A3B8"} />
                </div>
                <div>
                  <h4 style={{ fontSize: "16px", color: "#0F172A", marginBottom: "4px" }}>{ach.title}</h4>
                  <p style={{ fontSize: "13px", color: "var(--ink-soft)" }}>{ach.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Enrolled Roadmaps Section */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "22px", color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Compass size={22} color="var(--primary)" /> My Enrolled Career Roadmaps ({myEnrolledRoadmaps.length})
          </h2>
          <button
            onClick={() => navigate("/roadmaps")}
            style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            Explore Roadmaps Library <ChevronRight size={16} />
          </button>
        </div>

        {myEnrolledRoadmaps.length === 0 ? (
          <Card glass padding="24px" style={{ textAlign: "center", color: "var(--ink-soft)" }}>
            <p style={{ fontSize: "14px", marginBottom: "12px" }}>You are not currently enrolled in any career roadmaps.</p>
            <Button variant="primary" size="sm" onClick={() => navigate("/roadmaps")}>
              Browse & Enroll in Roadmaps
            </Button>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {myEnrolledRoadmaps.map((rm) => (
              <Card key={rm.slug} glass padding="20px" style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "28px" }}>{rm.icon}</span>
                    <button
                      onClick={() => handleUnenrollRoadmap(rm.slug)}
                      style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#EF4444", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      title="Unenroll from this roadmap"
                    >
                      <Trash2 size={13} /> Unenroll
                    </button>
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>
                    {rm.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {rm.tagline}
                  </p>
                </div>

                <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontWeight: 600 }}>
                    {rm.milestones?.length || 0} Milestones · {rm.estimated_weeks}
                  </span>
                  <button
                    onClick={() => navigate("/roadmaps")}
                    style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    View Roadmap <ChevronRight size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Subject Progress Breakdown */}
      <div>
        <h2 style={{ fontSize: "22px", color: "#0F172A", marginBottom: "16px" }}>Subject Progress</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {subjects.map((sub) => (
            <Card key={sub.name} glass padding="20px">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>{sub.name}</span>
                <span style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 700 }}>
                  {sub.mastered_topics} / {sub.total_topics} Mastered
                </span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${sub.mastery_percent}%` }} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
