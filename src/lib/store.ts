/**
 * File-based persistence for Phase 1.
 * Uses storage/data/*.json. Coach-scoped queries; date range by calendar month.
 */

import type { Coach, Player, Lesson, RecurringSeries } from "./types";
import { isWithinBookingWindow } from "./calendar";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "storage", "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filename: string): T[] {
  ensureDataDir();
  const file = path.join(DATA_DIR, filename);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf-8");
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeJson<T>(filename: string, data: T[]) {
  ensureDataDir();
  const file = path.join(DATA_DIR, filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

export function listCoaches(): Coach[] {
  return readJson<Coach>("coaches.json");
}

export function getCoach(id: string): Coach | undefined {
  return listCoaches().find((c) => c.id === id);
}

export function addCoach(coach: Coach): void {
  const list = listCoaches();
  if (list.some((c) => c.id === coach.id)) return;
  list.push(coach);
  writeJson("coaches.json", list);
}

export function listPlayersByCoach(coachId: string): Player[] {
  return readJson<Player>("players.json").filter((p) => p.coachId === coachId);
}

export function getPlayer(id: string): Player | undefined {
  return readJson<Player>("players.json").find((p) => p.id === id);
}

export function addPlayer(player: Player): void {
  const list = readJson<Player>("players.json");
  if (list.some((p) => p.id === player.id)) return;
  list.push(player);
  writeJson("players.json", list);
}

export function updatePlayer(player: Player): void {
  const list = readJson<Player>("players.json");
  const i = list.findIndex((p) => p.id === player.id);
  if (i >= 0) list[i] = player;
  writeJson("players.json", list);
}

export function removePlayer(id: string): void {
  const list = readJson<Player>("players.json").filter((p) => p.id !== id);
  writeJson("players.json", list);
  const lessons = readJson<Lesson>("lessons.json").filter((l) => l.playerId !== id);
  writeJson("lessons.json", lessons);
  const recurring = readJson<RecurringSeries>("recurring.json").filter((r) => r.playerId !== id);
  writeJson("recurring.json", recurring);
}

export function listRecurringByCoach(coachId: string): RecurringSeries[] {
  return readJson<RecurringSeries>("recurring.json").filter((r) => r.coachId === coachId);
}

export function addRecurring(series: RecurringSeries): void {
  const list = readJson<RecurringSeries>("recurring.json");
  if (list.some((r) => r.id === series.id)) return;
  list.push(series);
  writeJson("recurring.json", list);
}

export function removeRecurringSeries(id: string): void {
  const list = readJson<RecurringSeries>("recurring.json").filter((r) => r.id !== id);
  writeJson("recurring.json", list);
}

export function listLessons(): Lesson[] {
  return readJson<Lesson>("lessons.json");
}

export function listLessonsByCoach(coachId: string, start: Date, end: Date): Lesson[] {
  const startT = start.getTime();
  const endT = end.getTime();
  return listLessons().filter(
    (l) =>
      l.coachId === coachId &&
      new Date(l.start).getTime() >= startT &&
      new Date(l.start).getTime() <= endT
  );
}

export function listLessonsForPlayer(playerId: string, start: Date, end: Date): Lesson[] {
  const startT = start.getTime();
  const endT = end.getTime();
  return listLessons().filter(
    (l) =>
      l.playerId === playerId &&
      new Date(l.start).getTime() >= startT &&
      new Date(l.start).getTime() <= endT
  );
}

export function addLesson(lesson: Lesson): { ok: boolean; error?: string } {
  if (!isWithinBookingWindow(new Date(lesson.start))) {
    return { ok: false, error: "Lesson must be in current or next calendar month" };
  }
  const list = listLessons();
  if (list.some((l) => l.id === lesson.id)) return { ok: false, error: "Lesson id exists" };
  list.push(lesson);
  writeJson("lessons.json", list);
  return { ok: true };
}

export function removeLesson(id: string): void {
  const list = listLessons().filter((l) => l.id !== id);
  writeJson("lessons.json", list);
}

export function seedIfEmpty(): void {
  if (listCoaches().length > 0) return;
  addCoach({ id: "c1", name: "Coach Anna" });
  addCoach({ id: "c2", name: "Coach Ben" });
  addPlayer({ id: "p1", coachId: "c1", name: "Player One", color: "#b5d6b2" });
  addPlayer({ id: "p2", coachId: "c1", name: "Player Two", color: "#a8d4e6" });
  addPlayer({ id: "p3", coachId: "c2", name: "Player Three", color: "#f2c4b8" });
}
