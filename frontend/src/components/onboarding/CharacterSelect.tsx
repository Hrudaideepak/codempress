/**
 * CharacterSelect — Full-screen mascot picker
 *
 * Shows all 8 mascots with their name, tone, sample dialogue,
 * and the actual first-frame sprite image.  Click to select.
 */

import { motion, AnimatePresence } from "framer-motion";
import { MASCOTS } from "../../config/mascots";
import { MASCOT_FOLDER, hasVideoFor, videoPath } from "../../config/mascotConfig";
import { useAppStore } from "../../store/appStore";
import { useMascotStore } from "../../store/mascotStore";
import { supabase } from "../../services/supabaseClient";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CharacterSelect() {
  const isOpen = useAppStore((s) => s.isMascotModalOpen);
  const setMascot = useAppStore((s) => s.setMascot);
  const user = useAppStore((s) => s.user);
  const setMascotStore = useMascotStore((s) => s.setMascot);

  const handleSelect = async (id: number) => {
    setMascot(id);
    setMascotStore(id);

    // Persist to Supabase
    if (user?.id && supabase) {
      try {
        await supabase
          .from("profiles")
          .update({
            selected_mascot_id: id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      } catch (err) {
        console.warn("Failed to persist mascot selection:", err);
      }
    }

    localStorage.setItem("hasCompletedTour", "true");
  };

  const mascots = MASCOTS;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="char-select-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(11, 12, 16, 0.94)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto",
            padding: 24,
          }}
        >
          <motion.h1
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ color: "#A78BFA", fontSize: 28, fontWeight: 700, marginBottom: 8 }}
          >
            Choose Your Guide
          </motion.h1>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{ color: "#C5C6C7", marginBottom: 32, fontSize: 14 }}
          >
            Each mascot has a unique personality. Pick the one that speaks to you.
          </motion.p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 20,
              maxWidth: 900,
              width: "100%",
            }}
          >
            {mascots.map((m, i) => {
              const folder = MASCOT_FOLDER[m.id] ?? "raccoon";
              const spritePath = `/mascots/${folder}/1_idle.png`;
              const videoSrc = hasVideoFor(folder, "IDLE") ? videoPath(folder, "IDLE") : null;

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  whileHover={{ scale: 1.04, borderColor: "#A78BFA" }}
                  style={{
                    background: "#1E1B2E",
                    border: "2px solid #2a2740",
                    borderRadius: 16,
                    padding: 20,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    transition: "border-color 0.2s",
                  }}
                  onClick={() => handleSelect(m.id)}
                >
                  {videoSrc ? (
                    <video
                      src={videoSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "contain",
                        marginBottom: 8,
                        filter: "drop-shadow(0 4px 12px rgba(124,58,237,0.25))",
                      }}
                    />
                  ) : (
                    <img
                      src={spritePath}
                      alt={m.name}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "contain",
                        marginBottom: 8,
                        filter: "drop-shadow(0 4px 12px rgba(124,58,237,0.25))",
                      }}
                    />
                  )}
                  <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>
                    {m.name}
                  </h3>
                  <span style={{ color: "#A78BFA", fontSize: 12, fontWeight: 500, margin: "2px 0 6px" }}>
                    {m.animal} — {m.tone}
                  </span>
                  <p style={{ color: "#999", fontSize: 11, lineHeight: 1.4, margin: 0, fontStyle: "italic" }}>
                    &ldquo;{m.dialogueMap.tour[0]}&rdquo;
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
