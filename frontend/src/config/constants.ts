/**
 * Codempress Application Constants and Enums
 */

export enum UserRole {
  Explorer = "Explorer",
  Apprentice = "Apprentice",
  Journeyman = "Journeyman",
  Master = "Master",
  Architect = "Architect",
  Legend = "Legend"
}

export enum TopicStatus {
  Locked = "locked",
  Available = "available",
  Completed = "completed"
}

export enum MentorTab {
  Chat = "chat",
  CoverLetter = "cover_letter",
  Interview = "interview",
  Analytics = "analytics",
  Resume = "resume",
  Roadmap = "roadmap"
}

export const APP_CONFIG = {
  VERSION: "1.0.0",
  API_TIMEOUT_MS: 30000,
  PROGRESS_CACHE_TTL_MS: 30000,
  MAX_RESUME_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
};
