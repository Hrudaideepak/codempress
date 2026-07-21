import { useNavigate } from "react-router-dom";
import HeroScene from "../HeroScene";
import { useAuth } from "../AuthContext";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const enter = () => navigate(user ? "/library" : "/auth");

  return (
    <div className="container">
      <div className="hero landing">
        <HeroScene />
        <div className="hero-content landing-content">
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <img src="/brand/master_logo.png" alt="CodeEmpress" style={{ maxWidth: "220px", height: "auto" }} />
          </div>
          <span className="landing-badge">✦ Gamified Coding Education</span>
          <h1>
            Forge your <span>coding mastery</span>
          </h1>
          <p>
            Read theory, take practice quizzes, and level up from Explorer to
            Legend. Sign in to unlock your personal Arcane Library.
          </p>

          <div className="landing-cta">
            <button className="btn btn-primary landing-enter" onClick={enter}>
              Enter the Library →
            </button>
            <p className="landing-note">
              Sign in with Google or email · Secured with custom JWT session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
