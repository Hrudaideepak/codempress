import { create } from "zustand";
import { EVENT_TO_ACTION, DEFAULT_DIALOGUE, EMOTION_REPLIES } from "../config/mascotConfig";
import { getMascotById } from "../config/mascots";
import { sendMascotMessage } from "../services/apiClient";

export interface ChatMessage {
  sender: "user" | "mascot";
  text: string;
  emotion?: string;
}

export interface MascotState {
  selectedMascotId: number;
  action: string;
  isSpeaking: boolean;
  message: string;
  emotion: string;
  chatMessages: ChatMessage[];
  chatOpen: boolean;
  roamTarget: { x: number; y: number };
  roamEnabled: boolean;
  facingRight: boolean;
  isThinking: boolean;

  setMascot: (id: number) => void;
  triggerDialogue: (eventType: string, customMessage?: string) => void;
  clearDialogue: () => void;
  triggerEmotion: (key: string) => void;
  sendMessage: (text: string) => Promise<void>;
  toggleChat: () => void;
  setRoamTarget: (x: number, y: number) => void;
  setRoamEnabled: (v: boolean) => void;
  setFacingRight: (v: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (timer) { clearTimeout(timer); timer = null; }
}

// Local fallback for when AI is unavailable
const localKeywordMatcher = (msg: string): { reply: string; action: string } => {
  const lower = msg.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) return { reply: "Hey there! 👋", action: "WAVE" };
  if (lower.includes("how are you")) return { reply: "I am doing great! 🎉", action: "HAPPY" };
  if (lower.includes("jump")) return { reply: "Wheee! Look at me! 🚀", action: "JUMP" };
  if (lower.includes("dance")) return { reply: "🎶 Dancing time! 🕺", action: "DANCING" };
  if (lower.includes("sad") || lower.includes("cry")) return { reply: "Oh no, I am here for you! 🤗", action: "SAD" };
  if (lower.includes("angry") || lower.includes("mad")) return { reply: "Whoa, take a breath! 😤", action: "ANGRY" };
  if (lower.includes("sleep") || lower.includes("tired")) return { reply: "Zzzz... Just kidding! 😴", action: "SLEEPING" };
  if (lower.includes("help") || lower.includes("confused")) return { reply: "Let me think about that... 🤔", action: "THINKING" };
  if (lower.includes("love") || lower.includes("cute")) return { reply: "Aww, I love you too! 🥰", action: "BLUSHING" };
  if (lower.includes("surprise") || lower.includes("wow") || lower.includes("omg")) return { reply: "OMG! I did not see that! 😮", action: "SURPRISED" };
  if (lower.includes("laugh") || lower.includes("funny") || lower.includes("haha")) return { reply: "Hahaha! That is hilarious! 🤣", action: "LAUGHING" };
  return { reply: "I didn't quite catch that. Say something else? ✨", action: "IDLE" };
};

export const useMascotStore = create<MascotState>((set, get) => ({
  selectedMascotId: 1,
  action: "IDLE",
  isSpeaking: false,
  message: "",
  emotion: "IDLE",
  chatMessages: [],
  chatOpen: false,
  roamTarget: { x: 80, y: 85 },
  roamEnabled: true,
  facingRight: true,
  isThinking: false,

  setMascot: (id) => {
    if (id >= 1 && id <= 8) {
      set({ selectedMascotId: id, action: "IDLE", emotion: "IDLE", isSpeaking: false, chatMessages: [], chatOpen: false });
    }
  },

  triggerDialogue: (eventType, customMessage) => {
    const action = EVENT_TO_ACTION[eventType] ?? "IDLE";
    const msg = customMessage ?? DEFAULT_DIALOGUE[action] ?? "Hello!";
    set({ action, emotion: action, isSpeaking: true, message: msg });
    clearTimer();
    timer = setTimeout(() => {
      set({ isSpeaking: false, action: "IDLE", emotion: "IDLE" });
    }, 4000);
  },

  clearDialogue: () => {
    clearTimer();
    set({ isSpeaking: false, message: "", action: "IDLE", emotion: "IDLE" });
  },

  triggerEmotion: (key) => {
    const emotion = EMOTION_REPLIES[key];
    if (!emotion) return;
    set({
      action: emotion.action,
      emotion: emotion.action,
      isSpeaking: true,
      message: emotion.reply,
      isThinking: false,
    });
    set((s) => ({
      chatMessages: [...s.chatMessages, { sender: "mascot", text: `[${key}] ${emotion.reply}`, emotion: emotion.action }],
    }));
    clearTimer();
    timer = setTimeout(() => {
      set({ isSpeaking: false, action: "IDLE", emotion: "IDLE" });
    }, 4000);
  },

  sendMessage: async (text) => {
    const state = get();
    if (!text.trim()) return;
    const mascot = getMascotById(state.selectedMascotId);
    if (!mascot) return;

    set((s) => ({ chatMessages: [...s.chatMessages, { sender: "user", text }], isThinking: true, isSpeaking: false }));

    try {
      const aiResponse = await sendMascotMessage(text, state.selectedMascotId);
      let reply: string;
      let emotion: string;

      if (aiResponse) {
        reply = aiResponse.reply;
        emotion = aiResponse.action;
      } else {
        const local = localKeywordMatcher(text);
        reply = local.reply;
        emotion = local.action;
      }

      set((s) => ({
        chatMessages: [...s.chatMessages, { sender: "mascot", text: reply, emotion }],
        emotion, action: emotion, isThinking: false, isSpeaking: true, message: reply,
      }));

      clearTimer();
      timer = setTimeout(() => {
        set({ isSpeaking: false, action: "IDLE", emotion: "IDLE" });
      }, 5000);
    } catch {
      const local = localKeywordMatcher(text);
      set((s) => ({
        chatMessages: [...s.chatMessages, { sender: "mascot", text: local.reply, emotion: local.action }],
        action: local.action, emotion: local.action, isThinking: false, isSpeaking: true, message: local.reply,
      }));
      timer = setTimeout(() => set({ isSpeaking: false, action: "IDLE", emotion: "IDLE" }), 4000);
    }
  },

  toggleChat: () => {
    const state = get();
    const next = !state.chatOpen;
    set({ chatOpen: next });
    if (next && state.chatMessages.length === 0) {
      const mascot = getMascotById(state.selectedMascotId);
      if (mascot) {
        const greeting = mascot.getDialogue("idle");
        set({ chatMessages: [{ sender: "mascot", text: greeting, emotion: "IDLE" }] });
      }
    }
  },

  setRoamTarget: (x, y) => set({ roamTarget: { x, y } }),
  setRoamEnabled: (v) => set({ roamEnabled: v }),
  setFacingRight: (v) => set({ facingRight: v }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
}));
