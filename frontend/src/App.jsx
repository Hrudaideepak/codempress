import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Volume2, VolumeX, Terminal, Shield, Sparkles, Compass } from "lucide-react";
import { api } from "./api";
import { AuthProvider, useAuth } from "./AuthContext";
import { ToastProvider, useToast } from "./ToastContext";
import ErrorBoundary from "./ErrorBoundary";
import Spinner from "./components/ui/Spinner";
import { soundService } from "./services/soundService";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Library from "./pages/Library";
import Subject from "./pages/Subject";
import TopicReader from "./pages/TopicReader";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import Forge from "./pages/Forge";
import Roadmaps from "./pages/Roadmaps";
import RoadmapDetail from "./pages/RoadmapDetail";
import RoadmapStageReader from "./pages/RoadmapStageReader";
import RoadmapTailored from "./pages/RoadmapTailored";
import Mentor from "./pages/Mentor";
import NotFound from "./pages/NotFound";

function TopBar() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ total_xp: 0, current_streak: 0 });
  const [muted, setMuted] = useState(soundService.isMuted());
  const location = useLocation();

  const scheduleStreakReminder = () => {
    if (!window.Capacitor) return;
    import("@capacitor/local-notifications").then(({ LocalNotifications }) => {
      LocalNotifications.requestPermissions().then((perm) => {
        if (perm.display !== "granted") return;
        LocalNotifications.cancel({ notifications: [{ id: 42 }] }).then(() => {
          LocalNotifications.schedule({
            notifications: [
              {
                title: "Maintain your Codempress streak! 🔥",
                body: "Don't let your code magic fade! Complete a quick topic now to keep your streak active.",
                id: 42,
                schedule: { at: new Date(Date.now() + 24 * 3600 * 1000) }
              }
            ]
          });
        });
      });
    });
  };

  useEffect(() => {
    const handleSoundToggle = (e) => {
      setMuted(e.detail.muted);
    };
    window.addEventListener("codempress:sound-toggle", handleSoundToggle);
    return () => window.removeEventListener("codempress:sound-toggle", handleSoundToggle);
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = () =>
      api
        .getProgress()
        .then((p) => {
          setStats(p);
          scheduleStreakReminder();
        })
        .catch(() => {});
    load();
    const onFocus = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("codempress:progress", load);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("codempress:progress", load);
    };
  }, [user]);

  return (
    <header className="topbar">
      <Link to="/library" className="brand">
        <img
          src="/brand/android_adaptive_icon.png"
          alt="Codempress"
          style={{ height: "36px", width: "36px", borderRadius: "10px", display: "block" }}
        />
        <span className="brand-text">Codempress</span>
      </Link>
      <div className="topbar-right">
        <div style={{ display: "flex", gap: "8px", marginRight: "12px" }}>
          <Link
            to="/library"
            className={`nav-link ${location.pathname === "/library" ? "active" : ""}`}
          >
            Library
          </Link>
          <Link
            to="/roadmaps"
            className={`nav-link ${location.pathname === "/roadmaps" ? "active" : ""}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Compass size={14} /> Roadmaps
          </Link>
          <Link
            to="/mentor"
            className={`nav-link ${location.pathname === "/mentor" ? "active" : ""}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Sparkles size={14} /> AI Mentor
          </Link>
          <Link
            to="/forge"
            className={`nav-link ${location.pathname === "/forge" ? "active" : ""}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Terminal size={14} /> Forge
          </Link>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => soundService.toggleMute()}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            marginRight: "6px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: muted ? "#94A3B8" : "#C084FC",
            cursor: "pointer"
          }}
          title={muted ? "Unmute audio feedback" : "Mute audio feedback"}
          aria-label={muted ? "Unmute audio feedback" : "Mute audio feedback"}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span>{muted ? "Muted" : "Sound"}</span>
        </button>

        <div className="stat-pills">
          <span className="pill xp">✦ {stats.total_xp} XP</span>
          <span className="pill streak">🔥 {stats.current_streak}</span>
        </div>

        {user && (
          <div className="user-chip">
            <Link to="/profile" className="profile-link" title="Your profile">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="user-avatar" />
              ) : (
                <span className="user-avatar fallback">
                  {user.name?.[0] || user.email?.[0] || "?"}
                </span>
              )}
            </Link>
            <button className="logout-btn" onClick={logout} title="Sign out of your account">
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const lastBackPress = useRef(0);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    const CURRENT_VERSION = "1.0.0";
    api
      .getAppStatus()
      .then((status) => {
        if (status && status.latest_version !== CURRENT_VERSION) {
          setUpdateInfo(status);
        }
      })
      .catch((err) => console.log("Failed to check app status:", err));
  }, []);

  useEffect(() => {
    if (!window.Capacitor) return;

    let activeListener = null;

    import("@capacitor/app").then(({ App: CapacitorApp }) => {
      CapacitorApp.addListener("backButton", (event) => {
        const path = location.pathname;
        if (path === "/" || path === "/library" || path === "/auth") {
          const now = Date.now();
          if (now - lastBackPress.current < 2000) {
            CapacitorApp.exitApp();
          } else {
            lastBackPress.current = now;
            toast.push("Press back again to exit", "info");
          }
        } else {
          navigate(-1);
        }
      }).then((listener) => {
        activeListener = listener;
      });
    });

    return () => {
      if (activeListener) activeListener.remove();
    };
  }, [location.pathname, navigate, toast]);

  return (
    <div className="app-shell">
      {updateInfo && (
        <div
          style={{
            backgroundColor: "#F59E0B",
            color: "#ffffff",
            padding: "10px 15px",
            textAlign: "center",
            fontWeight: "700",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            zIndex: 1000,
            position: "relative"
          }}
        >
          <span>✨ A new update (v{updateInfo.latest_version}) is available!</span>
          <a
            href={updateInfo.apk_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              backgroundColor: "rgba(0,0,0,0.2)",
              padding: "4px 8px",
              borderRadius: "4px",
              fontWeight: "800",
              marginLeft: "10px"
            }}
          >
            Download APK
          </a>
          <button
            onClick={() => setUpdateInfo(null)}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "16px",
              marginLeft: "15px",
              fontWeight: "900"
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      <main className="main-content">
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "60vh"
              }}
            >
              <Spinner size="lg" color="var(--primary)" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={user ? <Navigate to="/library" replace /> : <Auth />} />
            <Route
              path="/library"
              element={
                <RequireAuth>
                  <TopBar />
                  <Library />
                </RequireAuth>
              }
            />
            <Route
              path="/subject/:category"
              element={
                <RequireAuth>
                  <TopBar />
                  <Subject />
                </RequireAuth>
              }
            />
            <Route
              path="/topic/:id"
              element={
                <RequireAuth>
                  <TopBar />
                  <TopicReader />
                </RequireAuth>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <RequireAuth>
                  <TopBar />
                  <Quiz />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <TopBar />
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="/roadmaps"
              element={
                <>
                  <TopBar />
                  <Roadmaps />
                </>
              }
            />
            <Route
              path="/roadmaps/:slug"
              element={
                <>
                  <TopBar />
                  <RoadmapDetail />
                </>
              }
            />
            <Route
              path="/roadmaps/:slug/stage/:stageId"
              element={
                <>
                  <TopBar />
                  <RoadmapStageReader />
                </>
              }
            />
            <Route
              path="/roadmaps/tailored/:roadmapId"
              element={
                <>
                  <TopBar />
                  <RoadmapTailored />
                </>
              }
            />
            <Route
              path="/mentor"
              element={
                <RequireAuth>
                  <TopBar />
                  <Mentor />
                </RequireAuth>
              }
            />
            <Route
              path="/forge"
              element={
                <RequireAuth>
                  <TopBar />
                  <Forge />
                </RequireAuth>
              }
            />
            <Route path="/subjects" element={<Navigate to="/library" replace />} />
            <Route path="/analyze" element={<Navigate to="/mentor" replace />} />
            <Route
              path="*"
              element={
                <>
                  {user && <TopBar />}
                  <NotFound />
                </>
              }
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppShell />
          <Analytics />
        </ErrorBoundary>
      </AuthProvider>
    </ToastProvider>
  );
}
