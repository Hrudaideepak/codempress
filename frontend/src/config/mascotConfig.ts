/**
 * Codempress — Mascot Animation Frame Config
 *
 * Maps every mascot's 20 action names → frame number (1-based).
 * Also maps app event types to preferred action strings.
 *
 * The file system follows:  /mascots/{name}/{frame}_{action}.png
 * e.g. /mascots/cat/5_happy.png, /mascots/dog/15_fetch.png
 */

// ---------------------------------------------------------------------------
// Frame maps — each mascot has 20 frames with unique action names
// ---------------------------------------------------------------------------

export const MASCOT_FRAMES: Record<string, Record<string, number>> = {
  cat: {
    IDLE: 1, WALK: 2, JUMP: 3, WAVE: 4, HAPPY: 5,
    ANGRY: 6, SAD: 7, SHY: 8, SLEEPING: 9, THINKING: 10,
    SURPRISED: 11, LAUGHING: 12, DANCING: 13, GLITCHING: 14,
    PLAYINGYARN: 15, FLOATING: 16, POINTING: 17, CRYING: 18,
    BLUSHING: 19, MEDITATING: 20,
  },
  dog: {
    IDLE: 1, WALK: 2, JUMP: 3, WAVE: 4, HAPPY: 5,
    ANGRY: 6, SAD: 7, SHY: 8, SLEEPING: 9, THINKING: 10,
    SURPRISED: 11, LAUGHING: 12, DANCING: 13, GLITCHING: 14,
    FETCH: 15, FLOATING: 16, POINTING: 17, CRYING: 18,
    BLUSHING: 19, MEDITATING: 20,
  },
  dragon: {
    IDLE: 1, WALK: 2, JUMP: 3, WAVE: 4, HAPPY: 5,
    ANGRY: 6, SAD: 7, SHY: 8, SLEEPING: 9, THINKING: 10,
    SURPRISED: 11, LAUGHING: 12, DANCING: 13, GLITCHING: 14,
    FLOATING: 15, PEEKING: 16, POINTING: 17, CRYING: 18,
    BLUSHING: 19, MEDITATING: 20,
  },
  monkey: {
    IDLE: 1, WALK: 2, JUMP: 3, WAVE: 4, HAPPY: 5,
    ANGRY: 6, SAD: 7, SHY: 8, SLEEPING: 9, THINKING: 10,
    SURPRISED: 11, LAUGHING: 12, DANCING: 13, GLITCHING: 14,
    BANANA_SLIP: 15, FLOATING: 16, POINTING: 17, CRYING: 18,
    BLUSHING: 19, EATING_BANANA: 20,
  },
  rabbit: {
    IDLE: 1, WALK: 2, JUMP: 3, WAVE: 4, HAPPY: 5,
    ANGRY: 6, SAD: 7, SHY: 8, SLEEPING: 9, THINKING: 10,
    SURPRISED: 11, LAUGHING: 12, DANCING: 13, GLITCHING: 14,
    HUGGINGBOOK: 15, POINTING: 16, PEEKING: 17, CRYING: 18,
    BLUSHING: 19, MEDITATING: 20,
  },
  raccoon: {
    IDLE: 1, WALK: 2, JUMP: 3, WAVE: 4, HAPPY: 5,
    ANGRY: 6, SAD: 7, SHY: 8, SLEEPING: 9, THINKING: 10,
    SURPRISED: 11, LAUGHING: 12, DANCING: 13, GLITCHING: 14,
    RUMMAGING: 15, PEEKING: 16, POINTING: 17, CRYING: 18,
    BLUSHING: 19, MEDITATING: 20,
  },
  robot: {
    IDLE: 1, WALK: 2, JUMP: 3, WAVE: 4, HAPPY: 5,
    ANGRY: 6, SAD: 7, SHY: 8, SLEEPING: 9, THINKING: 10,
    SURPRISED: 11, LAUGHING: 12, DANCING: 13, GLITCHING: 14,
    HOVERING: 15, FLOATING: 16, POINTING: 17, CRYING: 18,
    BLUSHING: 19, MEDITATING: 20,
  },
  snake: {
    IDLE: 1, SLITHER: 2, JUMP: 3, WAVE: 4, HAPPY: 5,
    ANGRY: 6, SAD: 7, SHY: 8, SLEEPING: 9, THINKING: 10,
    SURPRISED: 11, LAUGHING: 12, DANCING: 13, GLITCHING: 14,
    HYPNOTIZING: 15, COILED: 16, STRIKING: 17, HISSING: 18,
    BLUSHING: 19, MEDITATING: 20,
  },
};

// ---------------------------------------------------------------------------
// Event → action mapping  (what your app events translate to)
// ---------------------------------------------------------------------------

export const EVENT_TO_ACTION: Record<string, string> = {
  success: "HAPPY",
  error: "ANGRY",
  idle: "IDLE",
  tour: "WAVE",
  milestone: "DANCING",
  celebrate: "DANCING",
  walking: "WALK",
  jumping: "JUMP",
  thinking: "THINKING",
  surprised: "SURPRISED",
  sleeping: "SLEEPING",
  laughing: "LAUGHING",
  recap: "THINKING",
};

// ---------------------------------------------------------------------------
// Mascot name lookup  (1-based ID → folder name)
// ---------------------------------------------------------------------------

export const MASCOT_FOLDER: Record<number, string> = {
  1: "raccoon",
  2: "monkey",
  3: "dragon",
  4: "rabbit",
  5: "dog",
  6: "cat",
  7: "robot",
  8: "snake",
};

export const MASCOT_ID_BY_FOLDER: Record<string, number> = {
  raccoon: 1,
  monkey: 2,
  dragon: 3,
  rabbit: 4,
  dog: 5,
  cat: 6,
  robot: 7,
  snake: 8,
};

// ---------------------------------------------------------------------------
// Default dialogue per action
// ---------------------------------------------------------------------------

export const DEFAULT_DIALOGUE: Record<string, string> = {
  HAPPY: "Great job!",
  ANGRY: "Oops, try again!",
  DANCING: "You did it!",
  IDLE: "What's next?",
  WAVE: "Hello there!",
  THINKING: "Hmm, let me think...",
};

// ---------------------------------------------------------------------------
// Video availability  — which actions have .mp4 files per mascot
// ---------------------------------------------------------------------------

export const HAS_VIDEO: Record<string, string[]> = {
  cat: ["angry", "crying"],
  dog: ["angry","blushing","crying","floating","glitching","happy","idle","jump","laughing","peeking","pointing","sad","shy","sleeping","surprised","thinking","walk"],
  dragon: ["angry","blushing","crying","floating","glitching","happy","idle","jump","laughing","peeking","pointing","sad","shy","sleeping","surprised","thinking","walk"],
  monkey: ["angry","blushing","crying","floating","glitching","idle","jump","laughing","peeking","pointing","sad","shy","sleeping","surprised","thinking","walk"],
  rabbit: ["angry","blushing","crying","floating","glitching","idle","jump","laughing","peeking","pointing","sleeping","thinking"],
  raccoon: ["angry","blushing","crying","floating","glitching","happy","idle","jump","laughing","peeking","pointing","sad","shy","sleeping","surprised","thinking","walk"],
  snake: ["angry","blushing","coiled","crying","floating","glitching","happy","idle","jump","laughing","peeking","pointing","sad","sleeping","surprised","thinking","walk"],
};

export function hasVideoFor(folder: string, action: string): boolean {
  const acts = HAS_VIDEO[folder];
  if (!acts) return false;
  return acts.includes(action.toLowerCase());
}

export function videoPath(folder: string, action: string): string {
  return `/mascots/videos/${folder}/${action.toLowerCase()}.mp4`;
}

// ---------------------------------------------------------------------------
// Mood palette  — emotion → visual config for the glow / label
// ---------------------------------------------------------------------------

export interface MoodConfig {
  glowColor: string;
  label: string;
  roamSpeed: number;
}

export const MOOD_PALETTE: Record<string, MoodConfig> = {
  HAPPY:      { glowColor: "#FBBF24", label: "Happy", roamSpeed: 1.2 },
  ANGRY:      { glowColor: "#EF4444", label: "Frustrated", roamSpeed: 1.5 },
  SAD:        { glowColor: "#3B82F6", label: "Sad", roamSpeed: 0.5 },
  SHY:        { glowColor: "#EC4899", label: "Shy", roamSpeed: 0.6 },
  THINKING:   { glowColor: "#8B5CF6", label: "Thinking", roamSpeed: 0.8 },
  SURPRISED:  { glowColor: "#F97316", label: "Surprised", roamSpeed: 1.3 },
  LAUGHING:   { glowColor: "#22C55E", label: "Laughing", roamSpeed: 1.1 },
  SLEEPING:   { glowColor: "#6366F1", label: "Sleepy", roamSpeed: 0.3 },
  BLUSHING:   { glowColor: "#F43F5E", label: "Embarrassed", roamSpeed: 0.7 },
  DANCING:    { glowColor: "#D946EF", label: "Celebrating", roamSpeed: 1.8 },
  WAVE:       { glowColor: "#FBBF24", label: "Waving", roamSpeed: 1.0 },
  WALK:       { glowColor: "#A78BFA", label: "Walking", roamSpeed: 1.0 },
  JUMP:       { glowColor: "#A78BFA", label: "Jumping", roamSpeed: 0.5 },
  GLITCHING:  { glowColor: "#10B981", label: "Glitching", roamSpeed: 1.5 },
  COILED:     { glowColor: "#6366F1", label: "Coiled", roamSpeed: 0.2 },
  POINTING:   { glowColor: "#A78BFA", label: "Pointing", roamSpeed: 0.5 },
  PEEKING:    { glowColor: "#EC4899", label: "Peeking", roamSpeed: 0.4 },
  FLOATING:   { glowColor: "#60A5FA", label: "Floating", roamSpeed: 0.3 },
  IDLE:       { glowColor: "#A78BFA", label: "Chill", roamSpeed: 1.0 },
};

export function getMoodConfig(action: string): MoodConfig {
  return MOOD_PALETTE[action] ?? MOOD_PALETTE.IDLE;
}

// ---------------------------------------------------------------------------
// Roaming boundaries (percentage of viewport)
// ---------------------------------------------------------------------------

export const ROAM_BOUNDS = {
  minX: 5,
  maxX: 85,
  minY: 15,
  maxY: 85,
};

export const ROAM_INTERVAL_MS = 4000;

// ---------------------------------------------------------------------------
// Emotion quick-buttons  — emoji palette shown in the chat input
// ---------------------------------------------------------------------------

export interface EmotionButton {
  key: string;
  emoji: string;
  label: string;
}

export const EMOTION_BUTTONS: EmotionButton[] = [
  { key: "HAPPY", emoji: "😊", label: "Happy" },
  { key: "SAD", emoji: "😢", label: "Sad" },
  { key: "ANGRY", emoji: "😤", label: "Angry" },
  { key: "DANCING", emoji: "💃", label: "Dance" },
  { key: "SLEEPING", emoji: "😴", label: "Sleep" },
  { key: "THINKING", emoji: "🤔", label: "Think" },
  { key: "WAVE", emoji: "👋", label: "Wave" },
  { key: "SURPRISED", emoji: "😮", label: "Surprise" },
  { key: "LAUGHING", emoji: "🤣", label: "Laugh" },
  { key: "BLUSHING", emoji: "🥰", label: "Love" },
];

export const EMOTION_REPLIES: Record<string, { action: string; reply: string }> = {
  HAPPY:     { action: "HAPPY", reply: "Yay! I am so happy! 😊" },
  SAD:       { action: "CRYING", reply: "Oh no... I feel sad now... 😢" },
  ANGRY:     { action: "ANGRY", reply: "Grrr! That makes me angry! 😤" },
  DANCING:   { action: "DANCING", reply: "Let's dance! 🕺💃" },
  SLEEPING:  { action: "SLEEPING", reply: "Zzzz... I am so sleepy... 😴" },
  THINKING:  { action: "THINKING", reply: "Hmm, let me think about that... 🤔" },
  WAVE:      { action: "WAVE", reply: "Hello there! 👋" },
  SURPRISED: { action: "SURPRISED", reply: "Oh my goodness! 😮" },
  LAUGHING:  { action: "LAUGHING", reply: "Hahaha! That is hilarious! 🤣" },
  BLUSHING:  { action: "BLUSHING", reply: "Aww... I love you too! 🥰" },
};
