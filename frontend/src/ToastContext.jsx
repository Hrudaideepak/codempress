import React, { createContext, useCallback, useContext, useState } from "react";
import { soundService } from "./services/soundService";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "success") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, type }]);

      if (type === "success") {
        soundService.playLevelUp();
      } else if (type === "error") {
        soundService.playIncorrect();
      } else {
        soundService.playPop();
      }

      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="toast-wrap"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "380px",
          pointerEvents: "none"
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type}`}
            style={{
              pointerEvents: "auto",
              background:
                t.type === "success"
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(6, 182, 212, 0.9) 100%)"
                  : t.type === "error"
                  ? "linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)"
                  : "linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)",
              color: "#ffffff",
              padding: "12px 18px",
              borderRadius: "14px",
              backdropFilter: "blur(16px)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "14px",
              fontWeight: 600,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              animation: "toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            }}
          >
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "#ffffff",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                fontSize: "14px",
                lineHeight: 1
              }}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
