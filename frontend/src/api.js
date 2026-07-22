const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "/api";

const TOKEN_KEY = "sf_token";
const USER_KEY = "sf_user";

// Library cache state (see getLibraryCached below).
let _libraryCache = null;
let _libraryCacheAt = 0;
const LIBRARY_TTL_MS = 60_000;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  _libraryCache = null;
  _libraryCacheAt = 0;
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

// --- Library cache -------------------------------------------------------
// The library payload is identical for Library + Subject pages and rarely
// changes within a session, so cache it to make back-navigation instant and
// avoid refetching on every page mount. Invalidated when progress changes.
async function getLibraryCached() {
  const now = Date.now();
  if (_libraryCache && now - _libraryCacheAt < LIBRARY_TTL_MS) {
    return _libraryCache;
  }
  const data = await request("/library");
  _libraryCache = data;
  _libraryCacheAt = now;
  return data;
}

export function invalidateLibraryCache() {
  _libraryCache = null;
  _libraryCacheAt = 0;
}

if (typeof window !== "undefined") {
  // Refresh library data after the user makes progress (theory read / quiz).
  window.addEventListener("codempress:progress", invalidateLibraryCache);
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers, ...options });
  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
    }
    if (res.status === 423) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.detail || "Locked — complete the previous topic to unlock this one.");
    }
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // ... existing methods
  logout: () => {
    // Clear local storage and optionally redirect
    clearSession();
    // Note: navigation is handled by caller
    return Promise.resolve();
  },
  signup: (email, password, name) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  loginWithGoogle: (idToken) =>
    request("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    }),
  devLogin: () => request("/auth/dev-login", { method: "POST" }),
  getMe: () => request("/auth/me"),
  getSubjects: () => request("/subjects"),
  getLibrary: () => getLibraryCached(),
  getTopic: async (id) => {
    const cacheKey = `topic_${id}`;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
      return null;
    }
    try {
      const data = await request(`/topics/${id}?_t=${Date.now()}`);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } catch (err) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
      throw err;
    }
  },
  getQuiz: async (id) => {
    const cacheKey = `quiz_${id}`;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
      return null;
    }
    try {
      const data = await request(`/topics/${id}/quiz?_t=${Date.now()}`);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } catch (err) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
      throw err;
    }
  },
  getChallenges: (id) => request(`/topics/${id}/challenges?_t=${Date.now()}`),
  submitQuizRunDirect: (id, score, total) =>
    request(`/topics/${id}/quiz-submit`, {
      method: "POST",
      body: JSON.stringify({ score, total }),
    }),
  submitQuizRun: async (id, score, total) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      addToQueue({ type: "quiz_submit", topicId: id, score, total });
      return { passed: score >= Math.ceil(total * 0.7), xp_earned: 50, offline: true };
    }
    return api.submitQuizRunDirect(id, score, total);
  },
  markTheoryReadDirect: (id) =>
    request(`/topics/${id}/theory-read`, { method: "POST", body: JSON.stringify({}) }),
  markTheoryRead: async (id) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      addToQueue({ type: "theory", topicId: id });
      try {
        const cacheKey = `topic_${id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.theory_read = 1;
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      } catch (err) {
        console.error("Failed to update offline topic read cache:", err);
      }
      return { mastery: 30, offline: true };
    }
    return api.markTheoryReadDirect(id);
  },
  answerQuizDirect: (questionId, selectedAnswer) =>
    request("/quiz/answer", {
      method: "POST",
      body: JSON.stringify({
        question_id: questionId,
        selected_answer: selectedAnswer,
      }),
    }),
  answerQuiz: async (questionId, selectedAnswer) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      addToQueue({ type: "quiz", questionId, selectedAnswer });
      return { correct: true, xp_earned: 10, offline: true };
    }
    return api.answerQuizDirect(questionId, selectedAnswer);
  },
  getProgress: () => request(`/progress/me?_t=${Date.now()}`),
  generateTopic: (topicId) =>
    request(`/topics/${topicId}/generate`, { method: "POST", body: JSON.stringify({}) }),
  getRewards: () => request(`/rewards/me?_t=${Date.now()}`),
  getAppStatus: () => request("/app-status"),
};

const QUEUE_KEY = "sf_offline_queue";

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

function addToQueue(item) {
  const q = getQueue();
  q.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function syncOfflineData() {
  if (typeof navigator === "undefined" || !navigator.onLine) return;
  const q = getQueue();
  if (q.length === 0) return;

  console.log(`[OfflineSync] Syncing ${q.length} pending actions...`);
  const remaining = [];

  for (const item of q) {
    try {
      if (item.type === "theory") {
        await api.markTheoryReadDirect(item.topicId);
      } else if (item.type === "quiz") {
        await api.answerQuizDirect(item.questionId, item.selectedAnswer);
      } else if (item.type === "quiz_submit") {
        await api.submitQuizRunDirect(item.topicId, item.score, item.total);
      }
    } catch (err) {
      console.error("[OfflineSync] Sync failed, leaving in queue:", item, err);
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } else {
    clearQueue();
    window.dispatchEvent(new Event("codempress:progress"));
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", syncOfflineData);
  setInterval(syncOfflineData, 30_000);
}
