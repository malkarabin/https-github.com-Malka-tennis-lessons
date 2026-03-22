/**
 * Phase 1 domain types.
 * Player belongs to exactly one coach. Lesson = coach + player + datetime + duration.
 */

export type Coach = {
  id: string;
  name: string;
};

export type Player = {
  id: string;
  coachId: string;
  name: string;
  color?: string; // hex e.g. #7cb342 — used to show booked slot in calendar
};

export type Lesson = {
  id: string;
  coachId: string;
  playerId: string;
  start: string; // ISO datetime
  durationMinutes: number;
};

/** Phase 2: recurring series template. weekday 0=Sun..6=Sat, hour 0-23. startDate optional ISO date (YYYY-MM-DD) for first occurrence. */
export type RecurringSeries = {
  id: string;
  coachId: string;
  playerId: string;
  weekday: number; // 0-6
  hour: number;
  endConditionType: "afterN" | "throughMonth";
  endConditionValue: number | "current" | "next" | "both"; // N for afterN; "current"|"next"|"both" for throughMonth
  startDate?: string; // optional ISO date (YYYY-MM-DD) — first occurrence on or after this date
  createdAt?: string; // ISO timestamp for sorting (newest first)
  canceledOccurrences?: number[]; // timestamps (ms) of canceled single occurrences
};

export type Role = "coach" | "player";

export type Session =
  | { role: "coach"; coachId: string }
  | { role: "player"; playerId: string; coachId: string };
