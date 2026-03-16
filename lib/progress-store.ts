"use client";

import { getSkillIds } from "@/lib/skill-catalog";
import { QuizRoundResult, SkillId, SkillProgress } from "@/lib/types";

const STORAGE_KEY = "zybezone-kids-learn.progress.v1";
const SESSION_KEY = "zybezone-kids-learn.last-session.v1";
const LAST_RESULT_KEY = "zybezone-kids-learn.last-result.v1";

type ProgressState = Record<SkillId, SkillProgress>;

function createDefaultProgress(skillId: SkillId): SkillProgress {
  return {
    skillId,
    cardsViewed: [],
    favoriteItemIds: [],
    quizzesCompleted: 0,
    bestScore: 0,
    currentStreak: 0,
    lastPlayedAt: null,
  };
}

function getDefaultState(): ProgressState {
  return Object.fromEntries(
    getSkillIds().map((skillId) => [skillId, createDefaultProgress(skillId)]),
  ) as ProgressState;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function readProgress(): ProgressState {
  if (!canUseStorage()) {
    return getDefaultState();
  }

  const defaults = getDefaultState();
  const stored = safeParse<Partial<ProgressState>>(window.localStorage.getItem(STORAGE_KEY), {});

  return Object.fromEntries(
    Object.entries(defaults).map(([skillId, defaultProgress]) => [
      skillId,
      stored[skillId] ? { ...defaultProgress, ...stored[skillId] } : defaultProgress,
    ]),
  ) as ProgressState;
}

export function writeProgress(progress: ProgressState) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markCardViewed(skillId: SkillId, itemId: string) {
  const progress = readProgress();
  const existing = progress[skillId] ?? createDefaultProgress(skillId);
  const viewed = new Set(existing.cardsViewed);
  viewed.add(itemId);

  progress[skillId] = {
    ...existing,
    cardsViewed: Array.from(viewed),
    lastPlayedAt: new Date().toISOString(),
  };

  writeProgress(progress);
}

export function toggleFavorite(skillId: SkillId, itemId: string) {
  const progress = readProgress();
  const existing = progress[skillId] ?? createDefaultProgress(skillId);
  const favoriteSet = new Set(existing.favoriteItemIds);

  if (favoriteSet.has(itemId)) {
    favoriteSet.delete(itemId);
  } else {
    favoriteSet.add(itemId);
  }

  progress[skillId] = {
    ...existing,
    favoriteItemIds: Array.from(favoriteSet),
    lastPlayedAt: new Date().toISOString(),
  };

  writeProgress(progress);
}

export function saveSessionSelection(skillIds: SkillId[], mode: "flashcards" | "quiz" | "map-quiz") {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      selectedSkillIds: skillIds,
      mode,
    }),
  );
}

export function readSessionSelection() {
  return canUseStorage()
    ? safeParse<{ selectedSkillIds: SkillId[]; mode: "flashcards" | "quiz" | "map-quiz" } | null>(
        window.localStorage.getItem(SESSION_KEY),
        null,
      )
    : null;
}

export function saveQuizResult(result: QuizRoundResult) {
  if (!canUseStorage()) {
    return;
  }

  const progress = readProgress();

  result.selectedSkillIds.forEach((skillId) => {
    const current = progress[skillId] ?? createDefaultProgress(skillId);
    progress[skillId] = {
      ...current,
      quizzesCompleted: current.quizzesCompleted + 1,
      bestScore: Math.max(current.bestScore, result.score),
      currentStreak: result.score >= Math.ceil(result.total * 0.7) ? current.currentStreak + 1 : 0,
      lastPlayedAt: new Date().toISOString(),
    };
  });

  writeProgress(progress);
  window.localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
}

export function readLastQuizResult(): QuizRoundResult | null {
  if (!canUseStorage()) {
    return null;
  }

  return safeParse<QuizRoundResult | null>(window.localStorage.getItem(LAST_RESULT_KEY), null);
}
