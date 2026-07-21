/**
 * Codempress global application store.
 *
 * Manages user identity, selected mascot, XP/level, and topic progress.
 * Uses Zustand with immer middleware for immutable updates.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
}

export interface TopicProgress {
  topicId: number;
  completedNodes: number;
  totalNodes: number;
  percentage: number;
}

export interface AppState {
  // ── Data ──────────────────────────────────────────────────────────
  user: User | null;
  mascotId: number | null;       // 1-8, null = not yet chosen
  xp: number;
  level: number;
  topicProgress: Record<number, TopicProgress>; // keyed by topicId
  currentTopicId: number | null;

  // ── UI flags ───────────────────────────────────────────────────────
  isMascotModalOpen: boolean;

  // ── Actions ────────────────────────────────────────────────────────
  setUser: (user: User | null) => void;
  setMascot: (id: number) => void;
  setMascotModalOpen: (open: boolean) => void;
  addXP: (amount: number) => void;
  setLevel: (level: number) => void;
  setProgress: (data: TopicProgress) => void;
  setCurrentTopicId: (id: number | null) => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: Pick<
  AppState,
  | "user"
  | "mascotId"
  | "xp"
  | "level"
  | "topicProgress"
  | "currentTopicId"
  | "isMascotModalOpen"
> = {
  user: null,
  mascotId: null,
  xp: 0,
  level: 1,
  topicProgress: {},
  currentTopicId: null,
  isMascotModalOpen: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>()(
  immer((set) => ({
    ...initialState,

    setUser: (user) =>
      set((state) => {
        state.user = user;
      }),

    setMascot: (id) =>
      set((state) => {
        if (id >= 1 && id <= 8) {
          state.mascotId = id;
          state.isMascotModalOpen = false;
        }
      }),

    setMascotModalOpen: (open) =>
      set((state) => {
        state.isMascotModalOpen = open;
      }),

    addXP: (amount) =>
      set((state) => {
        state.xp += amount;
      }),

    setLevel: (level) =>
      set((state) => {
        state.level = level;
      }),

    setProgress: (data) =>
      set((state) => {
        state.topicProgress[data.topicId] = data;
      }),

    setCurrentTopicId: (id) =>
      set((state) => {
        state.currentTopicId = id;
      }),

    reset: () =>
      set((state) => {
        state.user = null;
        state.mascotId = null;
        state.xp = 0;
        state.level = 1;
        state.topicProgress = {};
        state.currentTopicId = null;
        state.isMascotModalOpen = false;
      }),
  }))
);
