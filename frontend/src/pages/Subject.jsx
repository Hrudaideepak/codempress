import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import HeroScene from "../HeroScene";
import { useToast } from "../ToastContext";

function stars(n) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

export default function Subject() {
  const { category } = useParams();
  const decoded = decodeURIComponent(category || "");
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getLibrary()
      .then((data) => {
        setCategories(data.categories);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, []);

  const cat = useMemo(
    () => categories.find((c) => c.name === decoded),
    [categories, decoded]
  );

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
    </div>
  );
}
