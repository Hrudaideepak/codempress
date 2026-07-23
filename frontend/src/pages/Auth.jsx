import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GOOGLE_CLIENT_ID, loadGoogleScript } from "../auth";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";

function PasswordChecklist({ password }) {
  const rules = [
    { label: "At least 8 characters", test: (v) => v.length >= 8 },
    { label: "No more than 200 characters", test: (v) => v.length <= 200 },
    { label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
    { label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
    { label: "A number", test: (v) => /\d/.test(v) },
    {
      label: "A special character (!@#$…)",
      test: (v) => /[^A-Za-z0-9]/.test(v),
    },
  ];
  return (
    <ul className="pwd-checklist">
      {rules.map((r) => {
        const ok = password ? r.test(password) : false;
        return (
          <li key={r.label} className={ok ? "ok" : ""}>
            <span className="tick">{ok ? "✓" : "○"}</span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

export default function Auth() {
  const { loginWithGoogle, loginDevBypass, signup, login } = useAuth();
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

  const handleDevBypass = async () => {
    setSubmitting(true);
    try {
      await loginDevBypass();
      toast.push("Successfully logged in using Dev Bypass!", "success");
      navigate("/library");
    } catch (err) {
      toast.push(err.message || "Dev Bypass failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // Skip loading the web script on native Capacitor builds to prevent network errors.
    if (window.Capacitor) {
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      toast.push(
        "Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.",
        "error"
      );
      return;
    }
    let cancelled = false;
    loadGoogleScript()
      .then((google) => {
        if (cancelled) return;
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
          },
        });
        google.accounts.id.renderButton(gbtnRef.current, {
          theme: "outline",
          size: "large",
          width: 280,
          text: "continue_with",
        });
        setGoogleReady(true);
      })
      .catch((e) => {
        console.warn("Google Web Script load blocked (common if using ad-blockers or offline):", e);
      });
    return () => {
      cancelled = true;
    };
  }, []); // run once on mount — loginWithGoogle/navigate/toast refs are stable

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
        scopes: ["profile", "email"],
      });
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      if (!idToken) {
        throw new Error("Google Sign-In did not return an ID token.");
      }
      await loginWithGoogle(idToken);
      toast.push("Welcome to CodeEmpress!", "success");
      navigate("/library");
    } catch (e) {
      console.error("Native Google sign-in failed:", e);
      if (e.message && !e.message.includes("cancel")) {
        toast.push(e.message || "Native Google sign-in failed", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="auth-home" onClick={() => navigate("/")}>
        ← Back
      </button>
      <div className="auth-card">
        <div className="auth-head" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img
            src="/brand/android_adaptive_icon.png"
            alt="Codempress"
            style={{ width: "96px", height: "96px", borderRadius: "20px", marginBottom: "16px", display: "block" }}
          />
          <p>Unlock your Arcane Library</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${!isSignup ? "active" : ""}`}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            className={`auth-tab ${isSignup ? "active" : ""}`}
            onClick={() => setMode("signup")}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {isSignup && (
            <label className="auth-field" htmlFor="signup-name">
              <span>Name</span>
              <input
                id="signup-name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="name"
              />
            </label>
          )}

          <label className="auth-field" htmlFor="auth-email">
            <span>Email</span>
            <input
              id="auth-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {email && !emailValid && (
              <span className="field-error">Enter a valid email address.</span>
            )}
          </label>

          <label className="auth-field" htmlFor="auth-password">
            <span>Password</span>
            <div className="pwd-wrap">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {isSignup && <PasswordChecklist password={password} />}

          <button type="submit" className="btn btn-primary auth-submit" disabled={!formValid}>
            {submitting
              ? "Please wait…"
              : isSignup
              ? "Create account"
              : "Sign in"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-google" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          {window.Capacitor ? (
            <button
              type="button"
              className="btn btn-google-native"
              onClick={handleNativeGoogleSignIn}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "280px",
                height: "40px",
                backgroundColor: "#ffffff",
                color: "#1f1f1f",
                border: "1px solid #dadce0",
                borderRadius: "4px",
                fontFamily: "Roboto, arial, sans-serif",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                margin: "0 auto",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24c0-1.63-.15-3.2-.43-4.75H24v9h12.75c-.55 2.91-2.2 5.39-4.67 7.04l7.25 5.62C43.58 36.5 46.5 30.73 46.5 24z"/>
                <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.25-5.62c-2.01 1.35-4.58 2.15-7.64 2.15-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          ) : (
            <>
              {!googleReady && GOOGLE_CLIENT_ID && (
                <span className="gbtn-fallback">Loading Google…</span>
              )}
              {!GOOGLE_CLIENT_ID && (
                <span className="gbtn-fallback">Google not configured</span>
              )}
              <div ref={gbtnRef} className="gbtn" aria-label="Sign in with Google" style={{ margin: "0 auto" }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
