import React, { useState, useEffect } from "react";
import { api } from "../api";
import { Sparkles, X, Lightbulb, ChevronRight, Lock, Unlock, Code, AlertTriangle, RefreshCw } from "lucide-react";
import Button from "./ui/Button";

const HINT_LEVEL_TITLES = {
  1: "Level 1: Nudge (Conceptual Hint)",
  2: "Level 2: Guidance (Algorithmic Clue)",
  3: "Level 3: Code Pattern (Skeleton)",
  4: "Level 4: Full Solution (Reference Code)"
};

export default function SocraticHintDrawer({
  isOpen,
  onClose,
  topicId,
  exerciseTitle = "Exercise",
  userCode = "",
  errorTraceback = null,
  failedTestCase = null
}) {
  const [hints, setHints] = useState([]);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && topicId) {
      fetchHints();
    }
  }, [isOpen, topicId, userCode, errorTraceback]);

  const fetchHints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAIProgressiveHints(
        topicId,
        exerciseTitle,
        userCode,
        errorTraceback,
        failedTestCase
      );
      if (res && res.hints && res.hints.length > 0) {
        setHints(res.hints);
      } else {
        // Construct progressive fallback hints from response or error context
        const fallbackHints = [
          {
            level: 1,
            title: "Nudge",
            hint: errorTraceback
              ? "Review the line referenced in the error traceback. Check variable definitions and types."
              : "Carefully inspect your function input and return statement values."
          },
          {
            level: 2,
            title: "Guidance",
            hint: errorTraceback
              ? `The execution failed with: ${errorTraceback.split('\n')[0] || "Runtime error"}. Verify variable scope and syntax.`
              : "Trace your code step-by-step with the test case input."
          },
          {
            level: 3,
            title: "Code Pattern",
            hint: "Ensure you process inputs, apply loop/conditional logic, and return/print expected types.",
            code_snippet: userCode ? `# Verify pattern in your code:\n${userCode.slice(0, 100)}...` : undefined
          },
          {
            level: 4,
            title: "Solution",
            hint: "Double check problem constraints and standard implementation pattern."
          }
        ];
        setHints(fallbackHints);
      }
      setUnlockedLevel(1);
    } catch (err) {
      console.error("Failed to fetch Socratic hints:", err);
      setError("Unable to generate live AI hints. Check network connection.");
      setHints([
        {
          level: 1,
          title: "Nudge",
          hint: errorTraceback
            ? `Execution Error: ${errorTraceback}`
            : "Review your function logic and test case expectations."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="socratic-hint-overlay" onClick={onClose}>
      <div className="socratic-hint-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="socratic-hint-header">
          <div className="socratic-hint-title">
            <Sparkles size={20} color="#A855F7" />
            <div>
              <h3>AI Socratic Mentor</h3>
              <p>4-Level Progressive Hint Guidance</p>
            </div>
          </div>
          <button className="socratic-close-btn" onClick={onClose} aria-label="Close hints">
            <X size={20} />
          </button>
        </div>

        {/* Diagnostic Banner if error present */}
        {(errorTraceback || failedTestCase) && (
          <div className="socratic-error-banner">
            <AlertTriangle size={16} color="#EF4444" />
            <div>
              <strong>Error Context Attached:</strong>
              {errorTraceback && <div className="socratic-error-text">{errorTraceback}</div>}
              {failedTestCase && (
                <div className="socratic-error-text">
                  Failed Input: {typeof failedTestCase.input === 'object' ? JSON.stringify(failedTestCase.input) : String(failedTestCase.input)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="socratic-loading">
            <Sparkles className="spin-icon" size={28} color="#7C3AED" />
            <p>Analyzing code & generating Socratic hints...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="socratic-hints-list">
            {hints.map((hintItem) => {
              const lvl = hintItem.level || 1;
              const isUnlocked = lvl <= unlockedLevel;
              const isCurrentToUnlock = lvl === unlockedLevel + 1;

              return (
                <div
                  key={lvl}
                  className={`socratic-hint-card ${isUnlocked ? "unlocked" : "locked"}`}
                >
                  <div className="socratic-hint-card-header">
                    <div className="socratic-hint-badge">
                      {isUnlocked ? <Unlock size={14} color="#10B981" /> : <Lock size={14} color="#64748B" />}
                      <span>{HINT_LEVEL_TITLES[lvl] || `Level ${lvl}`}</span>
                    </div>

                    {!isUnlocked && isCurrentToUnlock && (
                      <button
                        className="socratic-unlock-btn"
                        onClick={() => setUnlockedLevel(lvl)}
                      >
                        <Unlock size={13} /> Unlock Hint
                      </button>
                    )}
                  </div>

                  {isUnlocked ? (
                    <div className="socratic-hint-body">
                      <p>{hintItem.hint || hintItem.content}</p>
                      {hintItem.code_snippet && (
                        <pre className="socratic-code-snippet">
                          <code>{hintItem.code_snippet}</code>
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="socratic-hint-locked-placeholder">
                      <span>Click unlock to reveal {HINT_LEVEL_TITLES[lvl]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer actions */}
        <div className="socratic-hint-footer">
          <Button variant="secondary" size="sm" onClick={fetchHints} leftIcon={<RefreshCw size={14} />}>
            Refresh Hints
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Got it, Back to Code
          </Button>
        </div>
      </div>
    </div>
  );
}
