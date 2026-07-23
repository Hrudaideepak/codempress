import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import RewardBanner from "../RewardBanner";
import { CheckCircle2, XCircle, Award, ArrowLeft, ArrowRight, HelpCircle, Sparkles } from "lucide-react";

export default function Quiz() {
  const params = useParams();
  const rawId = params.id || (typeof window !== "undefined" ? (window.location.pathname.split("/quiz/")[1] || "").split("/")[0] : "");
  const id = rawId && rawId !== "undefined" ? rawId : "";
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);
  const [masteryResult, setMasteryResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const currentId = id || (typeof window !== "undefined" ? (window.location.pathname.split("/quiz/")[1] || "").split("/")[0] : "");
    if (!currentId || currentId === "undefined") return;

    setStatus("loading");
    api.getTopic(currentId)
      .then(async (topicData) => {
        let qList = topicData?.questions || [];
        if (!qList || qList.length === 0) {
          await api.generateTopic(currentId);
          localStorage.removeItem(`topic_${currentId}`);
          topicData = await api.getTopic(currentId);
          qList = topicData?.questions || [];
        }
        setQuestions(qList);
        setStatus(qList.length > 0 ? "ready" : "empty");
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load quiz questions");
        setStatus("error");
      });
  }, [id]);

  const current = questions[index];

  const handleSelect = (optIdx) => {
    if (selected !== null) return;
    setSelected(optIdx);
    
    // In our backend schema, questions carry correct_answer index
    const isCorrect = optIdx === current.correct_answer;
    if (isCorrect) {
      setScore((s) => s + 1);
      toast.push("Correct answer! +10 XP", "success");
    } else {
      toast.push("Incorrect answer.", "error");
    }
  };

  const handleNext = async () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      // Quiz finished - submit to backend
      const submissionAnswers = questions.map((q, i) => ({
        question_id: q._id,
        selected_option: selected !== null ? selected : 0
      }));

      try {
        const data = await api.submitQuizSubmission(parseInt(id), submissionAnswers);
        setMasteryResult(data);
        setPassed(data.passed);
        setFinished(true);
        window.dispatchEvent(new Event("codempress:progress"));
      } catch (err) {
        toast.push("Failed to submit quiz results", "error");
      }
    }
  };

  if (status === "loading")
    return (
      <div className="container">
        <div className="state" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
          <div style={{
            width: "54px",
            height: "54px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #f59e0b 0%, #d97706 100%)",
            boxShadow: "0 0 24px rgba(245, 158, 11, 0.6), 0 0 48px rgba(245, 158, 11, 0.3)",
            display: "grid",
            placeItems: "center",
            marginBottom: "20px"
          }}>
            <HelpCircle size={28} color="#ffffff" />
          </div>
          <h2 style={{ color: "#b45309", fontSize: "22px", fontWeight: 700 }}>Preparing Quiz Assessment…</h2>
          <p style={{ color: "#d97706", fontSize: "14px", marginTop: "6px" }}>Fetching question bank and configuring options</p>
        </div>
      </div>
    );

  if (status === "empty" || status === "error")
    return (
      <div className="container">
        <div className="state">
          <h2>{errorMsg || "No quiz questions found"}</h2>
          <p>Generate theory and questions first for this topic.</p>
          <Link className="back-link" to={`/topic/${id}`}>
            ← Back to Topic
          </Link>
        </div>
      </div>
    );

  if (finished && masteryResult)
    return (
      <div className="container">
        <div style={{
          maxWidth: "540px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1.5px solid #ddd6fe",
          borderRadius: "28px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(124,58,237,0.08)"
        }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: passed ? "#e6f6ec" : "#fde7ec",
            color: passed ? "#16a34a" : "#be123c",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px"
          }}>
            {passed ? <Award size={36} /> : <XCircle size={36} />}
          </div>

          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
            {passed ? "Assessment Passed! 🎉" : "Keep Practicing"}
          </h2>

          <p style={{ color: "#6b7280", fontSize: "15px", marginBottom: "24px" }}>
            You scored <strong>{masteryResult.score_percent}%</strong> and earned <strong>+{masteryResult.xp_earned} XP</strong>!
          </p>

          <div style={{ background: "#f4f1ff", padding: "16px 20px", borderRadius: "16px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "#1f2937" }}>Topic Mastery Score</span>
            <span style={{ fontWeight: 800, color: "#7c3aed", fontSize: "18px" }}>{masteryResult.topic_mastery_percent}%</span>
          </div>

          <button
            onClick={() => navigate("/library")}
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "18px",
              padding: "16px 32px",
              fontWeight: 800,
              fontSize: "16px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              justifyContent: "center"
            }}
          >
            <span>Continue to Command Center</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );

  return (
    <div className="container">
      <div className="quiz">
        <Link className="back-link" to={`/topic/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <ArrowLeft size={16} />
          <span>Back to Lesson</span>
        </Link>

        {/* Header Progress Bar */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700, color: "#6b7280", marginBottom: "8px" }}>
            <span>Question {index + 1} of {questions.length}</span>
            <span>{Math.round(((index + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="question">
          <div className="q-text" style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>
            {current.question_text}
          </div>

          {current.code_snippet && (
            <div className="code-block" style={{ marginBottom: "20px" }}>
              {current.code_snippet}
            </div>
          )}

          {/* Options */}
          <div className="options" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {current.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = i === current.correct_answer;
              const hasAnswered = selected !== null;

              let cardBg = "#ffffff";
              let cardBorder = "1.5px solid #e5e7eb";
              let cardGlow = "none";
              let textColor = "#1f2937";

              if (hasAnswered) {
                if (isCorrect) {
                  cardBg = "rgba(16, 185, 129, 0.08)";
                  cardBorder = "2px solid #10b981";
                  cardGlow = "0 0 20px rgba(16, 185, 129, 0.4)";
                  textColor = "#065f46";
                } else if (isSelected) {
                  cardBg = "rgba(239, 68, 68, 0.08)";
                  cardBorder = "2px solid #ef4444";
                  cardGlow = "0 0 20px rgba(239, 68, 68, 0.4)";
                  textColor = "#991b1b";
                }
              }

              return (
                <button
                  key={i}
                  className="option"
                  disabled={hasAnswered}
                  onClick={() => handleSelect(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 24px",
                    borderRadius: "16px",
                    background: cardBg,
                    border: cardBorder,
                    boxShadow: cardGlow,
                    color: textColor,
                    fontWeight: isSelected || (hasAnswered && isCorrect) ? 700 : 500,
                    fontSize: "15px",
                    cursor: hasAnswered ? "default" : "pointer",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: isCorrect && hasAnswered ? "#10b981" : isSelected && !isCorrect ? "#ef4444" : "#f3f4f6",
                      color: (isCorrect && hasAnswered) || (isSelected && !isCorrect) ? "#ffffff" : "#4b5563",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "13px",
                      fontWeight: 700
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </span>

                  {hasAnswered && (
                    isCorrect ? (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#10b981",
                        fontWeight: 700,
                        fontSize: "14px"
                      }}>
                        <span>Correct</span>
                        <CheckCircle2 size={22} color="#10b981" />
                      </div>
                    ) : isSelected ? (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#ef4444",
                        fontWeight: 700,
                        fontSize: "14px"
                      }}>
                        <span>Wrong</span>
                        <XCircle size={22} color="#ef4444" />
                      </div>
                    ) : null
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Action Controls */}
          {selected !== null && (
            <div className="cta-row" style={{ marginTop: "24px" }}>
              <button className="btn btn-primary" onClick={handleNext} style={{ width: "100%" }}>
                {index + 1 >= questions.length ? "Finish Assessment →" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
