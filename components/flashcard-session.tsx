"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { TimerProgress } from "@/components/timer-progress";
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
};

const TIMER_OPTIONS = [10, 15, 20, 30, 45, 60];
const DEFAULT_VISIBLE_CLUES = 3;

export function FlashcardSession({ items, selectedSkillIds, stepSeconds }: FlashcardSessionProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedIdsRef = useRef(new Set<string>());
  const [sessionSeed] = useState(() => crypto.randomUUID());
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
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
    router.push(
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

  useEffect(() => {
    const target = containerRef.current;
    if (!target || document.fullscreenElement === target) {
      return;
    }

    const requestFullscreen = () => target.requestFullscreen?.().catch(() => undefined);
    void requestFullscreen();

    function tryAgain() {
      if (!document.fullscreenElement) {
        void requestFullscreen();
      }
      window.removeEventListener("pointerdown", tryAgain);
      window.removeEventListener("keydown", tryAgain);
    }

    window.addEventListener("pointerdown", tryAgain, { once: true });
    window.addEventListener("keydown", tryAgain, { once: true });

    return () => {
      window.removeEventListener("pointerdown", tryAgain);
      window.removeEventListener("keydown", tryAgain);
    };
  }, []);

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

  return (
    <div ref={containerRef} className="mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-7xl flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] bg-white/70 px-4 py-2 paper-shadow backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-900"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={exitSession}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            Exit Flashcards
          </button>
          <span className="rounded-full bg-orange-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-900">
            {selectedSkillIds.map(skillTitle).join(" + ")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-700">
            Timer
            <select
              value={secondsPerStep}
              onChange={(event) => {
                const nextSeconds = Number(event.target.value);
                setSecondsPerStep(nextSeconds);
                setSecondsLeft(nextSeconds);
              }}
              className="bg-transparent text-sm font-black text-slate-900 outline-none"
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
              autoMode ? "bg-orange-500 text-white" : "bg-white text-slate-900"
            }`}
          >
            {autoMode ? "Auto On" : "Auto Mode"}
          </button>
        </div>
      </div>

      <div className="grid flex-1 items-center gap-3 lg:grid-cols-[88px_minmax(0,1fr)_88px]">
        <div className="hidden lg:flex lg:justify-center">
          <button
            type="button"
            onClick={() => cycle(-1)}
            aria-label="Previous flashcard"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-4xl font-black text-white shadow-xl"
          >
            ←
          </button>
        </div>

        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3">
          <div className="flex w-full flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">Flashcards</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">{showCounter}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow">
                {autoMode ? `Next move in ${secondsLeft}s` : "Use ← and → to move"}
              </div>
              <button
                type="button"
                onClick={onToggleFavorite}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow"
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

          <div className="w-full rounded-[2.6rem] bg-white/85 p-3 paper-shadow backdrop-blur sm:p-4">
            <div className="mx-auto flex h-[calc(100dvh-15rem)] w-full max-w-[74rem] flex-col overflow-hidden rounded-[2.4rem] bg-[linear-gradient(160deg,#f7fbff_0%,#eef8ff_52%,#fff6ec_100%)] p-4 shadow-inner sm:p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                  {skillLabel(item.skillId)}
                </span>
                {flipped ? (
                  <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                    {itemBadge(item)}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 pt-1 text-center">
                <h3
                  className={`${flipped ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl"} font-black leading-[1.05] text-slate-900`}
                >
                  {title}
                </h3>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.28em] text-slate-500 sm:text-sm">
                  {subtitle}
                </p>
              </div>

              <div className="mt-3 flex-1">
                {flipped ? (
                  <div className="grid h-full gap-3 xl:grid-cols-[minmax(0,1.9fr)_minmax(14rem,0.7fr)]">
                    <div className="flex min-h-0 flex-col gap-3">
                      <section className="rounded-[1.6rem] bg-white/88 p-3 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                          Short Description
                        </p>
                        <p className="mt-1 text-[11px] leading-[1rem] text-slate-700 sm:text-xs sm:leading-5">
                          {description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {displayFields.map((field) => (
                            <div
                              key={`${field.label}-${field.value}`}
                              className="rounded-full bg-sky-50 px-2.5 py-1.5 text-[10px] leading-[0.95rem] text-slate-700 shadow-sm sm:text-[10.5px]"
                            >
                              <span className="mr-2 font-black text-sky-700">{field.label}:</span>
                              {field.value}
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="flex-1 rounded-[1.6rem] bg-emerald-50/95 p-3 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900">
                          10 Things To Remember
                        </p>
                        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                          {lessonFacts.map((fact, factIndex) => (
                            <div
                              key={fact}
                              className="rounded-[1rem] bg-white px-2.5 py-2 text-[10.5px] leading-[0.95rem] text-slate-700 shadow-sm sm:text-[11px] sm:leading-[1rem]"
                            >
                              <span className="mr-2 font-black text-emerald-700">{factIndex + 1}.</span>
                              {fact}
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="grid gap-3">
                      <section className="rounded-[1.6rem] bg-rose-50/95 p-3 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-900">
                          Fun Facts
                        </p>
                        <div className="mt-2.5 grid gap-2">
                          {funFacts.map((fact) => (
                            <div
                              key={fact}
                              className="rounded-[1.05rem] bg-white px-3 py-2 text-[10.5px] leading-[0.95rem] text-slate-700 shadow-sm sm:text-[11px] sm:leading-[1rem]"
                            >
                              {fact}
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-3">
                    <div className="rounded-[1.8rem] bg-white/90 p-4 shadow-sm">
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                        Clue Card Challenge
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700 sm:text-base">
                        Read the first three clues, guess the answer out loud, then open more clues or flip the card to check.
                      </p>
                    </div>

                    {clues.map((clue, clueIndex) => (
                      <div
                        key={clue}
                        className="rounded-[1.6rem] bg-white/85 px-5 py-4 text-sm leading-6 text-slate-800 shadow-sm sm:text-base sm:leading-7"
                      >
                        <span className="mr-3 font-black uppercase tracking-[0.14em] text-orange-600">
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
                        className="rounded-[1.4rem] bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-sm"
                      >
                        {showAllClues ? "Show Fewer Clues" : `Show ${remainingClues} More Clues`}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => cycle(-1)}
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white lg:hidden"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFlipped((current) => !current);
                    setSecondsLeft(secondsPerStep);
                  }}
                  className="rounded-full bg-orange-500 px-7 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-orange-500/30"
                >
                  {flipped ? "Back To Clues" : "Flip Card"}
                </button>
                <button
                  type="button"
                  onClick={() => cycle(1)}
                  className="rounded-full bg-slate-200 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-900"
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
            className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-4xl font-black text-white shadow-xl"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
