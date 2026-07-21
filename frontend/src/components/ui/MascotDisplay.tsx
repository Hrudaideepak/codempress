import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../services/supabaseClient";
import { useAppStore } from "../../store/appStore";
import { useMascotStore } from "../../store/mascotStore";
import {
  MASCOT_FRAMES,
  MASCOT_FOLDER,
  hasVideoFor,
  videoPath,
  getMoodConfig,
  ROAM_BOUNDS,
  ROAM_INTERVAL_MS,
} from "../../config/mascotConfig";
import { getMascotById } from "../../config/mascots";
import MascotChatInput from "./MascotChatInput";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface MascotEvent {
  id: number;
  user_id: string;
  event_type: string;
  mascot_message: string;
  created_at: string;
}

export default function MascotDisplay() {
  const mascotId = useMascotStore((s) => s.selectedMascotId);
  const action = useMascotStore((s) => s.action);
  const isSpeaking = useMascotStore((s) => s.isSpeaking);
  const message = useMascotStore((s) => s.message);
  const emotion = useMascotStore((s) => s.emotion);
  const chatOpen = useMascotStore((s) => s.chatOpen);
  const chatMessages = useMascotStore((s) => s.chatMessages);
  const roamEnabled = useMascotStore((s) => s.roamEnabled);
  const facingRight = useMascotStore((s) => s.facingRight);
  const triggerDialogue = useMascotStore((s) => s.triggerDialogue);
  const setMascot = useMascotStore((s) => s.setMascot);
  const toggleChat = useMascotStore((s) => s.toggleChat);
  const setFacingRight = useMascotStore((s) => s.setFacingRight);

  const user = useAppStore((s) => s.user);
  const storeMascotId = useAppStore((s) => s.mascotId);
  const prevPosition = useRef({ x: 0, y: 0 });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const folder = MASCOT_FOLDER[mascotId] ?? "raccoon";
  const frameMap = MASCOT_FRAMES[folder] ?? MASCOT_FRAMES.raccoon;
  const mood = getMoodConfig(emotion);
  const mascot = getMascotById(mascotId);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState(true);
  const [mediaError, setMediaError] = useState(false);

  const defaultX = typeof window !== "undefined" ? window.innerWidth - 180 : 1100;
  const defaultY = typeof window !== "undefined" ? window.innerHeight - 180 : 700;

  const useVideo = hasVideoFor(folder, action);
  const actionLower = action.toLowerCase();
  const frameNum = frameMap[action] ?? frameMap.IDLE ?? 1;
  const pngSrc = `/mascots/${folder}/${frameNum}_${actionLower}.png`;
  const fallbackPngSrc = `/mascots/${folder}/1_idle.png`;
  const mediaSrc = useVideo && !mediaError ? videoPath(folder, action) : (mediaError ? fallbackPngSrc : pngSrc);

  useEffect(() => { setMediaError(false); }, [videoPath(folder, action), pngSrc]);

  const handleMediaError = useCallback(() => {
    if (!mediaError) setMediaError(true);
  }, [mediaError]);

  useEffect(() => {
    if (storeMascotId && storeMascotId !== mascotId) setMascot(storeMascotId);
  }, [storeMascotId, mascotId, setMascot]);

  useEffect(() => {
    if (!initialPos) return;
    setPosition({ x: defaultX, y: defaultY });
    setInitialPos(false);
  }, [defaultX, defaultY, initialPos]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!roamEnabled || chatOpen) {
      setPosition({ x: defaultX, y: defaultY });
      return;
    }
    const pickSpot = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const rx = w * ROAM_BOUNDS.minX / 100 + Math.random() * (w * (ROAM_BOUNDS.maxX - ROAM_BOUNDS.minX) / 100);
      const ry = h * ROAM_BOUNDS.minY / 100 + Math.random() * (h * (ROAM_BOUNDS.maxY - ROAM_BOUNDS.minY) / 100);
      setFacingRight(rx > prevPosition.current.x);
      prevPosition.current = { x: rx, y: ry };
      setPosition({ x: rx, y: ry });
    };
    pickSpot();
    prevPosition.current = { x: defaultX, y: defaultY };
    const interval = setInterval(pickSpot, ROAM_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [roamEnabled, chatOpen, defaultX, defaultY]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("mascot-events")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "mascot_events", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePostgresChangesPayload<MascotEvent>) => {
          const ev = payload.new as MascotEvent;
          if (ev?.mascot_message && ev?.event_type) triggerDialogue(ev.event_type, ev.mascot_message);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, triggerDialogue]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const roamSpeed = mood.roamSpeed;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, pointerEvents: "none" }}>
      <motion.div
        animate={{ x: position.x, y: position.y }}
        transition={{ duration: chatOpen ? 0.3 : 3 / roamSpeed, ease: "easeInOut" }}
        style={{ position: "absolute", pointerEvents: "auto" }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 20, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  width: 280,
                  maxHeight: 420,
                  background: "#1E1B2E",
                  border: "1px solid rgba(124,58,237,0.3)",
                  borderRadius: "16px 16px 0 16px",
                  marginBottom: 8,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "#C5C6C7", fontSize: 13 }}>{mascot?.name ?? "Mascot"}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: mood.glowColor, boxShadow: `0 0 6px ${mood.glowColor}` }} />
                    <span style={{ fontSize: 11, color: "#888" }}>{mood.label}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleChat(); }} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 4px" }} title="Close">✕</button>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, minHeight: 100, maxHeight: 240 }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{
                      alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                      background: msg.sender === "user" ? "#7C3AED" : "#2a2740",
                      color: "#fff",
                      padding: "6px 12px",
                      borderRadius: msg.sender === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      maxWidth: "80%",
                      fontSize: 12,
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                    }}>
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <MascotChatInput inline />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSpeaking && message && !chatOpen && (
              <motion.div
                key="speech"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                style={{
                  background: "#1E1B2E",
                  color: "#C5C6C7",
                  padding: "10px 16px",
                  borderRadius: "16px 16px 4px 16px",
                  marginBottom: 8,
                  maxWidth: 220,
                  fontSize: 13,
                  lineHeight: 1.4,
                  boxShadow: `0 2px 12px ${mood.glowColor}33`,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  border: `1px solid ${mood.glowColor}44`,
                }}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (!chatOpen) toggleChat(); }}
            style={{
              position: "relative",
              cursor: "pointer",
              borderRadius: "50%",
              boxShadow: `0 0 24px ${mood.glowColor}66, 0 0 60px ${mood.glowColor}22`,
              transition: "box-shadow 0.4s ease",
              width: 120,
              height: 120,
              transform: `scaleX(${facingRight ? 1 : -1})`,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={mediaSrc}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.2 }}
                style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}
              >
                {useVideo && !mediaError ? (
                  <video
                    src={mediaSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={handleMediaError}
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                ) : (
                  <img
                    src={mediaSrc}
                    onError={handleMediaError}
                    alt={`${folder} ${action}`}
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div style={{
              position: "absolute", inset: -4, borderRadius: "50%",
              border: `2px solid ${mood.glowColor}88`,
              pointerEvents: "none",
              opacity: emotion === "IDLE" ? 0.3 : 0.8,
              transition: "opacity 0.4s ease, border-color 0.4s ease",
            }} />

            {emotion !== "IDLE" && (
              <div style={{
                position: "absolute", top: -6, right: -6,
                background: mood.glowColor, color: "#0B0C10",
                fontSize: 9, fontWeight: 800,
                padding: "2px 7px", borderRadius: 10,
                whiteSpace: "nowrap",
                boxShadow: `0 0 8px ${mood.glowColor}88`,
              }}>
                {mood.label}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
