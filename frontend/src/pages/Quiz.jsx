import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import RewardBanner from "../RewardBanner";

export default function Quiz() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [theoryRead, setTheoryRead] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);
  const [reward, setReward] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    let active = true;
    Promise.all([api.getQuiz(id), api.getTopic(id).catch(() => null)])
      .then(([quizData, topic]) => {
        if (!active) return;
        console.log("[Quiz] Fetched topic data:", JSON.stringify(topic));
        console.log("[Quiz] Fetched quiz data:", JSON.stringify(quizData));
        setQuestions(quizData.questions);
        setTheoryRead(Boolean(topic && topic.theory_read));
        setStatus(quizData.questions.length ? "ready" : "empty");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [id]);

  const current = questions[index];

  const submit = async (optIdx) => {
    if (selected !== null) return;
    setSelected(optIdx);
    try {
      const res = await api.answerQuiz(current.id, optIdx);
      setResult(res);
      if (res.correct) {
        setScore((s) => s + 1);
        toast.push("Correct!", "success");
      } else {
        toast.push("Not quite.", "error");
      }
      if (res.new_reward) setReward(res.new_reward);
    } catch (e) {
      toast.push(e.message, "error");
      setSelected(null);
    }
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      const needed = Math.ceil(questions.length * 0.7);
      const didPass = score >= needed;
      setPassed(didPass);
      setFinished(true);

      api.submitQuizRun(id, score, questions.length)
        .then((res) => {
          if (res.passed && res.xp_earned > 0) {
            toast.push(`Quiz passed! +${res.xp_earned} XP earned! 🎉`, "success");
          } else if (res.passed) {
            toast.push(`Quiz passed! ${score}/${questions.length} correct.`, "success");
          } else {
            toast.push(`Quiz failed. You scored ${score}/${questions.length}. Redirecting to re-read concepts...`, "error");
            setTimeout(() => {
              navigate(`/topic/${id}`);
            }, 2500);
          }
          if (res.new_reward) setReward(res.new_reward);
          window.dispatchEvent(new Event("codempress:progress"));
        })
        .catch((err) => {
          toast.push(err.message, "error");
        });
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setResult(null);
  };

  if (status === "loading")
    return (
      <div className="container">
        <div className="state">
          <img src="/brand/avatar_thinking.png" alt="Thinking" style={{ width: "90px", height: "auto", marginBottom: "15px" }} />
          <h2>Loading challenges…</h2>
        </div>
      </div>
    );

  if (status !== "ready")
    return (
      <div className="container">
        <div className="state">
          <img src="/brand/empty_state.png" alt="Empty" style={{ width: "100px", height: "auto", marginBottom: "15px" }} />
          <h2>No quiz available</h2>
          <p>This topic has no active questions yet.</p>
          <Link className="back-link" to={`/topic/${id}`}>
            ← Back to Theory
          </Link>
        </div>
      </div>
    );

  // Gate: must read the theory before attempting the quiz.
  if (!theoryRead)
    return (
      <div className="container">
        <div className="state">
          <img src="/brand/avatar_focused.png" alt="Read Theory" style={{ width: "90px", height: "auto", marginBottom: "15px" }} />
          <h2>Read the theory first 📖</h2>
          <p>
            You can only take the practice quiz after reading this topic's
            lesson. This ensures you actually learn before you test.
          </p>
          <Link className="btn btn-primary" to={`/topic/${id}`}>
            Go read the theory →
          </Link>
        </div>
      </div>
    );

  if (finished)
    return (
      <div className="container">
        <RewardBanner reward={reward} onClose={() => setReward(null)} />
        <div className="state">
          <img
            src={passed ? "/brand/avatar_celebration.png" : "/brand/avatar_oops.png"}
            alt={passed ? "Passed" : "Failed"}
            style={{ width: "100px", height: "auto", marginBottom: "15px" }}
          />
          <h2>{passed ? "Topic passed! 🎉" : "Not passed yet"}</h2>
          <p>
            You scored <strong>{score}/{questions.length}</strong>. You need at
            least <strong>{Math.ceil(questions.length * 0.7)}/{questions.length}</strong>{" "}
            to clear this topic and unlock the next one.
          </p>
          {passed ? (
            <Link className="btn btn-primary" to="/library">
              Continue to next topic →
            </Link>
          ) : (
            <div className="cta-row">
              <Link className="btn btn-ghost" to={`/topic/${id}`}>
                Re-read the theory
              </Link>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setFinished(false);
                  setScore(0);
                  setIndex(0);
                  setSelected(null);
                  setResult(null);
                }}
              >
                Retry quiz
              </button>
            </div>
          )}
        </div>
      </div>
    );

  const optClass = (i) => {
    if (selected === null) return "option";
    if (result === null) {
      return i === selected ? "option selected" : "option";
    }
    if (i === result.correct_answer) return "option correct";
    if (i === selected) return "option wrong";
    return "option";
  };

  return (
    <div className="container">
      <RewardBanner reward={reward} onClose={() => setReward(null)} />
      <div className="quiz">
        <Link className="back-link" to={`/topic/${id}`}>
          ← Back to Theory
        </Link>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <div className="question">
          <span className="q-num">
            Question {index + 1} of {questions.length}
          </span>
          <div className="q-text">{current.question_text}</div>
          {current.code_snippet && (
            <div className="code-block">{current.code_snippet}</div>
          )}
          <div className="options">
            {current.options.map((opt, i) => (
              <button
                key={i}
                className={optClass(i)}
                disabled={selected !== null}
                onClick={() => submit(i)}
              >
                {opt}
              </button>
            ))}
          </div>
          {result && (
            <>
              <div className="explain">
                <strong>{result.correct ? "Correct!" : "Explanation:"}</strong>{" "}
                {result.explanation}
              </div>
              <div className="cta-row">
                <button className="btn btn-primary" onClick={next}>
                  {index + 1 >= questions.length ? "Finish" : "Next Question →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
