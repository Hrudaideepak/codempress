import { useState, useRef, useEffect } from "react";
import { useMascotStore } from "../../store/mascotStore";
import { EMOTION_BUTTONS, getMoodConfig } from "../../config/mascotConfig";

interface Props {
  inline?: boolean;
}

export default function MascotChatInput({ inline = false }: Props) {
  const { isThinking, sendMessage, triggerEmotion, emotion } = useMascotStore();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const mood = getMoodConfig(emotion);

  useEffect(() => {
    if (!inline) setTimeout(() => inputRef.current?.focus(), 150);
  }, [inline]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isThinking) {
      sendMessage(input);
      setInput("");
    }
  };

  const containerStyle: React.CSSProperties = inline
    ? {
        padding: "8px 10px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }
    : {
        position: "absolute",
        bottom: "100%",
        right: 0,
        marginBottom: 12,
        width: 300,
        background: "#1E1B2E",
        borderRadius: 16,
        border: "1px solid rgba(124,58,237,0.3)",
        boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
        padding: 12,
      };

  return (
    <div style={containerStyle}>
      {/* Emoji palette */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {EMOTION_BUTTONS.map((btn) => (
          <button
            key={btn.key}
            onClick={() => triggerEmotion(btn.key)}
            disabled={isThinking}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "#C5C6C7",
              fontSize: 12,
              cursor: isThinking ? "not-allowed" : "pointer",
              opacity: isThinking ? 0.5 : 1,
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = mood.glowColor; e.currentTarget.style.background = `${mood.glowColor}22`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          >
            <span style={{ fontSize: 14 }}>{btn.emoji}</span>
            <span style={{ fontSize: 10 }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Text input */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isThinking ? "Thinking..." : "Ask me anything..."}
          disabled={isThinking}
          style={{
            flex: 1,
            background: "#0B0C10",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 20,
            padding: "8px 14px",
            color: "#C5C6C7",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={isThinking || !input.trim()}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: isThinking || !input.trim() ? "#333" : "#7C3AED",
            color: "#fff",
            fontSize: 14,
            cursor: isThinking || !input.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ➤
        </button>
      </form>
    </div>
  );
}
