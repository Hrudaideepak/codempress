import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GOOGLE_CLIENT_ID, loadGoogleScript } from "../auth";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";
import { ArrowLeft, Lock, Mail, User, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Button from "../components/ui/Button";

function PasswordChecklist({ password }) {
  const rules = [
    { label: "At least 8 characters", test: (v) => v.length >= 8 },
    { label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
    { label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
    { label: "A number", test: (v) => /\d/.test(v) },
    { label: "Special character (!@#$…)", test: (v) => /[^A-Za-z0-9]/.test(v) }
  ];
  return (
    <ul
      style={{
        listStyle: "none",
        padding: "12px 14px",
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        margin: "12px 0",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        fontSize: "12px"
      }}
    >
      {rules.map((r) => {
        const ok = password ? r.test(password) : false;
        return (
          <li key={r.label} style={{ color: ok ? "#34D399" : "var(--ink-faint)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>{ok ? "✓" : "○"}</span>
            <span>{r.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function Auth() {
  const { loginWithGoogle, signup, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [googleReady, setGoogleReady] = useState(false);
  const gbtnRef = useRef(null);

  const isSignup = mode === "signup";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid =
    password.length >= 8 &&
    password.length <= 200 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  const nameValid = !isSignup || name.trim().length > 0;
  const formValid = emailValid && passwordValid && nameValid && !submitting;

  useEffect(() => {
    if (window.Capacitor) return;
    if (!GOOGLE_CLIENT_ID) {
      toast.push("Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.", "error");
      return;
    }
    loadGoogleScript()
      .then((google) => {
        if (!window.__gsiInitialized) {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (resp) => {
              try {
                await loginWithGoogle(resp.credential);
                toast.push("Welcome to Codempress!", "success");
                navigate("/library");
              } catch (e) {
                toast.push(e.message || "Sign-in failed", "error");
              }
            }
          });
          window.__gsiInitialized = true;
        }
        if (gbtnRef.current) {
          google.accounts.id.renderButton(gbtnRef.current, {
            theme: "filled_blue",
            size: "large",
            width: 280,
            text: "continue_with"
          });
        }
        setGoogleReady(true);
      })
      .catch((e) => {
        console.warn("Google Web Script load issue:", e);
      });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!formValid) return;
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(email, password, name.trim() || undefined);
        toast.push("Account created — welcome!", "success");
      } else {
        await login(email, password);
        toast.push("Signed in successfully!", "success");
      }
      navigate("/library");
    } catch (err) {
      toast.push(err.message || "Authentication failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNativeGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
      await GoogleAuth.initialize({
        clientId: "679239699589-urpbqdd50nvop2hgkeuc508q850glfj1.apps.googleusercontent.com",
        serverClientId: "679239699589-urpbqdd50nvop2hgkeuc508q850glfj1.apps.googleusercontent.com",
        grantOfflineAccess: true,
        scopes: ["profile", "email"]
      });
      const googleUser = await GoogleAuth.signIn();
      const token =
        googleUser.authentication?.idToken ||
        googleUser.idToken ||
        googleUser.authentication?.accessToken ||
        googleUser.accessToken;

      if (!token) {
        throw new Error("Google Sign-In did not return an authorization token.");
      }
      await loginWithGoogle(token);
      toast.push("Welcome to Codempress!", "success");
      navigate("/library");
    } catch (e) {
      console.error("Native Google sign-in failed:", e);
      if (e.message && !e.message.includes("cancel") && !e.message.includes("12501")) {
        toast.push(e.message || "Native Google sign-in failed", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <button
          onClick={() => navigate("/")}
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
          <ArrowLeft size={16} /> Back to home
        </button>

        <div className="glass-panel" style={{ padding: "36px" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <img
              src="/brand/android_adaptive_icon.png"
              alt="Codempress"
              style={{ width: "64px", height: "64px", borderRadius: "16px", marginBottom: "12px" }}
            />
            <h2 style={{ fontSize: "24px", color: "#fff", marginBottom: "6px" }}>
              {isSignup ? "Create Your Account" : "Welcome Back"}
            </h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>
              Access your personalized CS curriculum & progress
            </p>
          </div>

          <div
            style={{
              display: "flex",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              padding: "4px",
              marginBottom: "24px"
            }}
          >
            <button
              onClick={() => setMode("signin")}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                borderRadius: "8px",
                background: !isSignup ? "var(--primary)" : "transparent",
                color: "#fff",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                borderRadius: "8px",
                background: isSignup ? "var(--primary)" : "transparent",
                color: "#fff",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {isSignup && (
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: "6px" }}>
                  Name
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="search-input"
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: "6px" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="search-input"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="search-input"
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--ink-faint)",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isSignup && <PasswordChecklist password={password} />}

            <Button variant="primary" fullWidth size="lg" loading={submitting} disabled={!formValid}>
              {isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "12px", color: "var(--ink-faint)" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            {window.Capacitor ? (
              <Button variant="secondary" fullWidth onClick={handleNativeGoogleSignIn}>
                Continue with Google
              </Button>
            ) : (
              <div ref={gbtnRef} style={{ width: "100%", display: "flex", justifyContent: "center" }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
