"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useStudyChrome } from "@/components/focus-shell";
import { TimerProgress } from "@/components/timer-progress";
import { navigateClient } from "@/lib/client-navigation";
import {
  buildCluePool,
  buildDescription,
  buildFunFacts,
  buildLearningFacts,
  getDisplayFieldLines,
  pickStudyClues,
} from "@/lib/learning-content";
import { markCardViewed, readProgress, toggleFavorite } from "@/lib/progress-store";
import { shuffleBySeed } from "@/lib/random";
import { itemBadge, skillLabel, skillTitle } from "@/lib/quiz";
import { stringifySkillIds } from "@/lib/session";
import { LearningCardItem, SkillId } from "@/lib/types";

type FlashcardSessionProps = {
  items: LearningCardItem[];
  selectedSkillIds: SkillId[];
  stepSeconds: number;
  initialAutoMode: boolean;
};

const TIMER_OPTIONS = [10, 15, 20, 30, 45, 60, 120];
const DEFAULT_VISIBLE_CLUES = 3;

export function FlashcardSession({
  items,
  selectedSkillIds,
  stepSeconds,
  initialAutoMode,
}: FlashcardSessionProps) {
  const router = useRouter();
  const { theme } = useStudyChrome();
  const viewedIdsRef = useRef(new Set<string>());
  const [sessionSeed] = useState(() => crypto.randomUUID());
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [autoMode, setAutoMode] = useState(initialAutoMode);
  const [secondsPerStep, setSecondsPerStep] = useState(stepSeconds);
  const [secondsLeft, setSecondsLeft] = useState(stepSeconds);
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    const progress = readProgress();
    return selectedSkillIds.flatMap((skillId) =>
      progress[skillId].favoriteItemIds.map((itemId) => `${skillId}:${itemId}`),
    );
  });
  const sessionItems = useMemo(
    () => shuffleBySeed(items, `${sessionSeed}:cards`, (entry) => `${entry.skillId}:${entry.id}`),
    [items, sessionSeed],
  );
  const item = sessionItems[index];
  const itemKey = item ? `${item.skillId}:${item.id}` : "";
  const isFavorite = itemKey ? favoriteIds.includes(itemKey) : false;
  const lessonFacts = item ? buildLearningFacts(item) : [];
  const funFacts = item ? buildFunFacts(item) : [];
  const showAllClues = itemKey !== "" && expandedItemKey === itemKey;
  const allClues = item
    ? pickStudyClues(item, buildCluePool(item).length, `${sessionSeed}:${itemKey}:${index}`)
    : [];
  const clues = showAllClues ? allClues : allClues.slice(0, DEFAULT_VISIBLE_CLUES);
  const description = item ? buildDescription(item) : "";
  const displayFields = item ? getDisplayFieldLines(item).slice(0, 6) : [];
  const remainingClues = Math.max(allClues.length - DEFAULT_VISIBLE_CLUES, 0);

  const cycle = useCallback(
    (direction: 1 | -1) => {
      setFlipped(false);
      setExpandedItemKey(null);
      setSecondsLeft(secondsPerStep);
      setIndex((current) => (current + direction + sessionItems.length) % sessionItems.length);
    },
    [secondsPerStep, sessionItems.length],
  );

  const exitSession = useCallback(() => {
    navigateClient(
      router,
      `/results?mode=flashcards&skills=${stringifySkillIds(selectedSkillIds)}&viewed=${viewedIdsRef.current.size}&total=${sessionItems.length}&favorites=${favoriteIds.length}`,
    );
  }, [favoriteIds.length, router, selectedSkillIds, sessionItems.length]);

  useEffect(() => {
    if (!item) {
      return;
    }

    markCardViewed(item.skillId, item.id);
    viewedIdsRef.current.add(`${item.skillId}:${item.id}`);
  }, [item]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        cycle(1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        cycle(-1);
      }

      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setFlipped((current) => !current);
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        setFlipped((current) => !current);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        exitSession();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cycle, exitSession, item]);

  useEffect(() => {
    if (!autoMode || !item) {
      return;
    }

    const tick = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    const flipTimer = window.setTimeout(
      () => setFlipped(true),
      Math.max(1000, (secondsPerStep * 1000) / 2),
    );
    const nextTimer = window.setTimeout(() => {
      cycle(1);
    }, secondsPerStep * 1000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(flipTimer);
      window.clearTimeout(nextTimer);
    };
  }, [autoMode, cycle, item, itemKey, secondsPerStep]);

  if (!item) {
    return (
      <section className="rounded-[2rem] bg-white p-8 paper-shadow">
        <p className="text-lg font-semibold text-slate-700">
          We could not find any cards for this selection.
        </p>
      </section>
    );
  }

  function onToggleFavorite() {
    toggleFavorite(item.skillId, item.id);
    setFavoriteIds((current) =>
      current.includes(itemKey)
        ? current.filter((entry) => entry !== itemKey)
        : [...current, itemKey],
    );
  }

  const title = flipped ? item.name : "Who am I?";
  const subtitle = flipped ? "Reveal and remember" : "Guess from the clues";
  const showCounter = `${index + 1} / ${sessionItems.length}`;
  const isDark = theme === "dark";
  const borderTone = isDark ? "border-slate-700" : "border-slate-300";
  const textTone = isDark ? "text-slate-100" : "text-slate-900";
  const mutedTone = isDark ? "text-slate-300" : "text-slate-600";
  const subtleTone = isDark ? "text-slate-400" : "text-slate-700";
  const ghostButton = isDark
    ? "border-slate-600 bg-slate-900/80 text-slate-100"
    : "border-slate-300 bg-white text-slate-900";
  const infoButton = isDark
    ? "border-slate-600 bg-slate-900/70 text-slate-200"
    : "border-slate-300 bg-white text-slate-800";
  const lineTone = isDark ? "border-slate-700" : "border-slate-300";
  const dividerTone = isDark ? "border-slate-700/80" : "border-slate-300";
  const accentLabel = isDark ? "text-sky-300" : "text-sky-800";
  const bodyTone = isDark ? "text-slate-100" : "text-slate-900";
  const contentTone = isDark ? "text-slate-200" : "text-slate-800";
  const sectionMuted = isDark ? "text-slate-400" : "text-slate-600";

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-6xl flex-col">
      <div className={`mb-3 flex flex-wrap items-center justify-between gap-3 border-b px-1 pb-3 ${borderTone}`}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exitSession}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            Exit Flashcards
          </button>
          <span className={`text-xs font-black uppercase tracking-[0.18em] ${mutedTone}`}>
            {selectedSkillIds.map(skillTitle).join(" + ")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] ${ghostButton}`}>
            Timer
            <select
              value={secondsPerStep}
              onChange={(event) => {
                const nextSeconds = Number(event.target.value);
                setSecondsPerStep(nextSeconds);
                setSecondsLeft(nextSeconds);
              }}
              className={`bg-transparent text-sm font-black outline-none ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {TIMER_OPTIONS.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds}s
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setAutoMode((current) => !current);
              setFlipped(false);
              setSecondsLeft(secondsPerStep);
            }}
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
              autoMode ? "bg-[var(--accent)] text-white" : infoButton
            }`}
          >
            {autoMode ? "Auto On" : "Auto Mode"}
          </button>
        </div>
      </div>

      <div className="grid flex-1 items-center gap-4 lg:grid-cols-[72px_minmax(0,1fr)_72px]">
        <div className="hidden lg:flex lg:justify-center">
          <button
            type="button"
            onClick={() => cycle(-1)}
            aria-label="Previous flashcard"
            className={`flex h-16 w-16 items-center justify-center rounded-full border text-3xl font-black ${ghostButton}`}
          >
            ←
          </button>
        </div>

        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5">
          <div className="flex w-full flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <p className={`text-sm font-black uppercase tracking-[0.22em] ${accentLabel}`}>Flashcards</p>
              <h2 className={`mt-1 text-2xl font-black ${textTone}`}>{showCounter}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-sm font-bold ${subtleTone}`}>
                {autoMode ? `Next move in ${secondsLeft}s` : "Use ← and → to move"}
              </div>
              <button
                type="button"
                onClick={onToggleFavorite}
                className={`rounded-full border px-4 py-2 text-sm font-bold ${ghostButton}`}
              >
                {isFavorite ? "Favorited" : "Favorite"}
              </button>
            </div>
          </div>

          <TimerProgress
            active={autoMode}
            label="Flashcard timer"
            secondsLeft={secondsLeft}
            totalSeconds={secondsPerStep}
          />

          <div className="w-full flex-1 px-1 py-1">
            <div className="mx-auto flex min-h-[calc(100dvh-15rem)] w-full max-w-[74rem] flex-col py-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase tracking-[0.2em] ${accentLabel}`}>
                  {skillLabel(item.skillId)}
                </span>
                {flipped ? (
                  <span className={`text-sm font-black uppercase tracking-[0.12em] ${mutedTone}`}>
                    {itemBadge(item)}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 text-center">
                <h3
                  className={`${flipped ? "text-4xl sm:text-5xl" : "text-5xl sm:text-7xl"} font-black leading-[1.02] ${textTone}`}
                >
                  {title}
                </h3>
                <p className={`mt-3 text-sm font-black uppercase tracking-[0.24em] sm:text-base ${mutedTone}`}>
                  {subtitle}
                </p>
              </div>

              <div className="mt-8 flex-1">
                {flipped ? (
                  <div className="grid h-full gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
                    <div className="flex min-h-0 flex-col gap-8">
                      <section className={`border-b pb-6 ${dividerTone}`}>
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${sectionMuted}`}>
                          Short Description
                        </p>
                        <p className={`mt-3 max-w-3xl text-lg leading-8 sm:text-xl sm:leading-9 ${contentTone}`}>
                          {description}
                        </p>
                      </section>

                      <section className={`border-b pb-6 ${dividerTone}`}>
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${accentLabel}`}>
                          Key Details
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          {displayFields.map((field) => (
                            <div key={`${field.label}-${field.value}`} className={`border-b pb-3 ${lineTone}`}>
                              <div className={`text-sm font-black uppercase tracking-[0.14em] ${sectionMuted}`}>
                                {field.label}
                              </div>
                              <div className={`mt-2 text-xl font-semibold leading-8 ${bodyTone}`}>
                                {field.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="grid gap-8">
                      <section>
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? "text-emerald-300" : "text-emerald-900"}`}>
                          10 Things To Remember
                        </p>
                        <div className="mt-4 grid gap-4">
                          {lessonFacts.map((fact, factIndex) => (
                            <div key={fact} className={`border-b pb-4 text-lg leading-8 sm:text-xl sm:leading-9 ${lineTone} ${contentTone}`}>
                              <span className={`mr-3 font-black ${isDark ? "text-emerald-300" : "text-emerald-800"}`}>{factIndex + 1}.</span>
                              {fact}
                            </div>
                          ))}
                        </div>
                      </section>

                      {funFacts.length > 0 ? (
                        <section>
                          <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? "text-rose-300" : "text-rose-900"}`}>
                            Fun Facts
                          </p>
                          <div className="mt-4 grid gap-4">
                            {funFacts.map((fact) => (
                              <div key={fact} className={`border-b pb-4 text-lg leading-8 sm:text-xl sm:leading-9 ${lineTone} ${contentTone}`}>
                                {fact}
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto flex h-full w-full max-w-4xl flex-col justify-center gap-6">
                    <div>
                      <p className={`text-sm font-black uppercase tracking-[0.18em] ${sectionMuted}`}>
                        Clue Card Challenge
                      </p>
                      <p className={`mt-3 text-lg leading-8 sm:text-xl sm:leading-9 ${contentTone}`}>
                        Read the first three clues, guess the answer out loud, then open more clues or flip the card to check.
                      </p>
                    </div>

                    {clues.map((clue, clueIndex) => (
                      <div
                        key={clue}
                        className={`border-l-4 border-[var(--accent)] pl-5 text-xl leading-9 sm:text-2xl sm:leading-10 ${bodyTone}`}
                      >
                        <span className="mr-3 block text-sm font-black uppercase tracking-[0.14em] text-[var(--accent)] sm:inline-block sm:text-base">
                          Clue {clueIndex + 1}
                        </span>
                        {clue}
                      </div>
                    ))}

                    {remainingClues > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedItemKey((current) => (current === itemKey ? null : itemKey))
                        }
                        className={`self-start rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.16em] ${ghostButton}`}
                      >
                        {showAllClues ? "Show Fewer Clues" : `Show ${remainingClues} More Clues`}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>

              <div className={`mt-8 flex flex-wrap items-center justify-center gap-3 border-t pt-5 ${dividerTone}`}>
                <button
                  type="button"
                  onClick={() => cycle(-1)}
                  className={`rounded-full border px-6 py-3 text-sm font-black uppercase tracking-[0.18em] lg:hidden ${ghostButton}`}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFlipped((current) => !current);
                    setSecondsLeft(secondsPerStep);
                  }}
                  className="rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
                >
                  {flipped ? "Back To Clues" : "Flip Card"}
                </button>
                <button
                  type="button"
                  onClick={() => cycle(1)}
                  className={`rounded-full border px-6 py-3 text-sm font-black uppercase tracking-[0.18em] ${ghostButton}`}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="hidden lg:flex lg:justify-center">
          <button
            type="button"
            onClick={() => cycle(1)}
            aria-label="Next flashcard"
            className={`flex h-16 w-16 items-center justify-center rounded-full border text-3xl font-black ${ghostButton}`}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
