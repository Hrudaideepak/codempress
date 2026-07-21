import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import HeroScene from "../HeroScene";
import { useToast } from "../ToastContext";

function stars(n) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

export default function Library() {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [rewards, setRewards] = useState(null);
  const [specialCode, setSpecialCode] = useState(() => localStorage.getItem("sf_special_code") || "");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    api
      .getLibrary()
      .then((data) => {
        setCategories(data.categories);
        setStatus(data.categories.length ? "ready" : "empty");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
    api
      .getRewards()
      .then((r) => setRewards(r))
      .catch(() => {});
  }, []);

  const openTopic = (topic) => {
    if (topic.locked) {
      toast.push("🔒 Locked — complete the previous topic to unlock.", "error");
      return;
    }
    navigate(`/topic/${topic.id}`);
  };

  const sortedCategories = categories
    .map((cat) => ({
      ...cat,
      topics: [...(cat.topics || [])].sort(
        (a, b) => (a.sequence || 0) - (b.sequence || 0)
      ),
    }))
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  const milestone = rewards?.next_milestone || 10;
  const cleared = rewards?.total_cleared || rewards?.cleared_count || 0;
  const toNext = cleared === 0 ? milestone : Math.max(0, milestone - (cleared % milestone || milestone));

  return (
    <div className="container">
      <div className="hero">
        <HeroScene />
        <div className="hero-content">
          <h1>
            The <span>Arcane Library</span>
          </h1>
          <p>
            Master coding one topic at a time. Read the theory, prove your
            understanding, and forge your path from Explorer to Legend.
          </p>
        </div>
      </div>

      {status === "loading" && (
        <div className="state">
          <h2>Summoning the shelves…</h2>
        </div>
      )}

      {status === "error" && (
        <div className="state">
          <h2>The library is sealed</h2>
          <p>{error}</p>
        </div>
      )}

      {status === "empty" && (
        <div className="state">
          <h2>No topics yet</h2>
          <p>Run content/content_generator.py to seed the curriculum.</p>
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="section-head hub-head">
            <h2>Choose a subject</h2>
            <span className="count">{categories.length} subjects</span>
          </div>
          <div className="subject-grid">
            {sortedCategories.map((cat) => {
              const locked = (cat.topics || []).filter((t) => t.locked).length;
              const clear = (cat.topics || []).filter((t) => t.cleared).length;
              return (
                <Link
                  key={cat.name}
                  to={`/subject/${encodeURIComponent(cat.name)}`}
                  className="subject-card"
                >
                  <div className="subject-card-top">
                    <span className="level-tag">{cat.name}</span>
                  </div>
                  <h3>{cat.name}</h3>
                  <p>
                    {cat.topic_count} topic{cat.topic_count === 1 ? "" : "s"} ·
                    {" "}{clear} cleared · {locked} locked
                  </p>
                  <div className="subject-card-foot">
                    <span className="badge-ready">Open →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
