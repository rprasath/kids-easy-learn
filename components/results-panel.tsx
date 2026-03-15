"use client";

import Link from "next/link";
import { useMemo } from "react";

import { readLastQuizResult } from "@/lib/progress-store";
import { skillTitle } from "@/lib/quiz";
import { stringifySkillIds } from "@/lib/session";
import { SkillId } from "@/lib/types";

type ResultsPanelProps = {
  favorites: number;
  mode: "flashcards" | "quiz";
  selectedSkillIds: SkillId[];
  score: number;
  total: number;
  viewed: number;
};

export function ResultsPanel({
  favorites,
  mode,
  selectedSkillIds,
  score,
  total,
  viewed,
}: ResultsPanelProps) {
  const storedResult = useMemo(() => readLastQuizResult(), []);
  const review = storedResult?.selectedSkillIds.join(",") === selectedSkillIds.join(",") ? storedResult : null;
  const percent = Math.round((score / Math.max(total, 1)) * 100);
  const headline =
    percent >= 80 ? "Awesome work" : percent >= 60 ? "Nice progress" : "Keep going";
  const isFlashcardSummary = mode === "flashcards";

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[2rem] bg-white/90 p-6 paper-shadow backdrop-blur">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
          {isFlashcardSummary ? "Flashcard Summary" : "Quiz Results"}
        </p>
        <h2 className="mt-2 text-4xl font-black text-slate-900">
          {isFlashcardSummary ? "Nice study session" : headline}
        </h2>
        <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-orange-100 via-white to-sky-100 p-6">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
            Selected skills
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {selectedSkillIds.map(skillTitle).join(" + ")}
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            {isFlashcardSummary ? (
              <>
                <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow">
                  <div className="text-sm text-slate-500">Cards viewed</div>
                  <div className="text-4xl font-black text-slate-900">
                    {viewed}/{total}
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow">
                  <div className="text-sm text-slate-500">Favorites saved</div>
                  <div className="text-4xl font-black text-slate-900">{favorites}</div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow">
                  <div className="text-sm text-slate-500">Score</div>
                  <div className="text-4xl font-black text-slate-900">
                    {score}/{total}
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow">
                  <div className="text-sm text-slate-500">Accuracy</div>
                  <div className="text-4xl font-black text-slate-900">{percent}%</div>
                </div>
              </>
            )}
          </div>
        </div>

        {!isFlashcardSummary && review ? (
          <div className="mt-6">
            <h3 className="text-xl font-black text-slate-900">Quick review</h3>
            <div className="mt-3 grid gap-3">
              {review.answers.map((answer, index) => (
                <div
                  key={answer.questionId}
                  className={`rounded-[1.5rem] px-4 py-3 ${
                    answer.isCorrect ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"
                  }`}
                >
                  <span className="mr-2 font-black">#{index + 1}</span>
                  {answer.isCorrect ? "Correct answer chosen" : "One to revisit later"}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <aside className="rounded-[2rem] bg-slate-900 p-6 text-white paper-shadow">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-300">
          {isFlashcardSummary ? "Next Step" : "Keep Going"}
        </p>
        <div className="mt-4 rounded-[1.5rem] bg-white/10 p-4 text-sm leading-6 text-white/85">
          {isFlashcardSummary
            ? "Now is a good time to jump into a quiz while the clues and facts are fresh."
            : "Best results usually come from one quick card review after every quiz round."}
        </div>
        <div className="mt-6 grid gap-3">
          {isFlashcardSummary ? (
            <Link
              href={`/quiz?skills=${stringifySkillIds(selectedSkillIds)}&count=10`}
              className="rounded-[1.4rem] bg-orange-500 px-4 py-4 text-center text-sm font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-orange-500/30"
            >
              Start Quiz
            </Link>
          ) : (
            <Link
              href={`/quiz?skills=${stringifySkillIds(selectedSkillIds)}&count=${total}`}
              className="rounded-[1.4rem] bg-orange-500 px-4 py-4 text-center text-sm font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-orange-500/30"
            >
              Play Again
            </Link>
          )}
          <Link
            href={`/learn?skills=${stringifySkillIds(selectedSkillIds)}`}
            className="rounded-[1.4rem] bg-white/10 px-4 py-4 text-center text-sm font-black uppercase tracking-[0.15em] text-white"
          >
            {isFlashcardSummary ? "Back To Cards" : "Review with Cards"}
          </Link>
          <Link
            href="/"
            className="rounded-[1.4rem] bg-white/10 px-4 py-4 text-center text-sm font-black uppercase tracking-[0.15em] text-white"
          >
            Change Skills
          </Link>
        </div>
      </aside>
    </section>
  );
}
