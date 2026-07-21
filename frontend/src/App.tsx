/**
 * Codempress Arcane Library — Main App Layout
 *
 * RPG Cyberpunk-themed SPA with:
 *   - HUD top bar (XP bar, level, mascot avatar, user avatar)
 *   - CharacterSelect onboarding modal
 *   - Floating MascotDisplay
 *   - Route-based page rendering
 */

import { useEffect } from "react";
import { Route, Routes, Link } from "react-router-dom";
import { useAppStore } from "./store/appStore";
import { MASCOTS } from "./config/mascots";
import { MASCOT_FOLDER } from "./config/mascotConfig";
import MascotDisplay from "./components/ui/MascotDisplay";
import CharacterSelect from "./components/onboarding/CharacterSelect";
import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "./ToastContext";
import "./styles/globals.css";

// Existing JSX pages — Vite handles mixed imports
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Library from "./pages/Library";
import Subject from "./pages/Subject";
import TopicReader from "./pages/TopicReader";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import Forge from "./pages/Forge";

// ---------------------------------------------------------------------------
// HUD Component
// ---------------------------------------------------------------------------

function HUD() {
  const user = useAppStore((s) => s.user);
  const xp = useAppStore((s) => s.xp);
  const level = useAppStore((s) => s.level);
  const mascotId = useAppStore((s) => s.mascotId);
  const setMascotModalOpen = useAppStore((s) => s.setMascotModalOpen);

  const mascot = MASCOTS.find((m) => m.id === mascotId);

  // XP bar: percentage toward next level
  const xpForCurrent = level > 1 ? 100 * (level - 1) ** 2 : 0;
  const xpForNext = 100 * level ** 2;
  const pct = (xpForNext - xpForCurrent) > 0
    ? Math.min(100, ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100)
    : 0;

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(11, 12, 16, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #2a2740",
        padding: "8px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link
          to="/library"
          style={{
            color: "#A78BFA",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: "0.5px",
          }}
        >
          ⬡ Codempress
        </Link>
        <Link to="/library" style={{ color: "#888", fontSize: 13 }}>
          Library
        </Link>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => setMascotModalOpen(true)}
          title={mascot ? `${mascot.name} — change` : "Choose mascot"}
          style={{
            background: "transparent",
            border: "1px solid #333",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          {mascot ? (
            <img
              src={`/mascots/${MASCOT_FOLDER[mascot.id] ?? "raccoon"}/1_idle.png`}
              alt={mascot.name}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : "❓"}
        </button>

        <span style={{ color: "#A78BFA", fontWeight: 700, fontSize: 13 }}>
          Lv. {level}
        </span>

        <div
          style={{
            width: 120,
            height: 8,
            background: "#2a2740",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
              borderRadius: 4,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {user && (
          <Link
            to="/profile"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#7C3AED",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              overflow: "hidden",
            }}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user.username?.charAt(0).toUpperCase() ?? "U"
            )}
          </Link>
        )}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const setUser = useAppStore((s) => s.setUser);
  const setMascotModalOpen = useAppStore((s) => s.setMascotModalOpen);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sf_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }

    const hasChosenMascot = localStorage.getItem("hasCompletedTour");
    if (!hasChosenMascot) {
      setMascotModalOpen(true);
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <div style={{ minHeight: "100vh", background: "#0B0C10", color: "#C5C6C7", paddingTop: 56 }}>
          <HUD />
          <CharacterSelect />
          <MascotDisplay />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/library" element={<Library />} />
            <Route path="/subject/:slug" element={<Subject />} />
            <Route path="/topic/:id" element={<TopicReader />} />
            <Route path="/quiz/:topicId" element={<Quiz />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/forge" element={<Forge />} />
          </Routes>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
