"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { GeographyMap } from "@/components/geography-map";
import { TimerProgress } from "@/components/timer-progress";
import { buildDescription, buildFunFacts, getDisplayFieldLines, getItemBadge } from "@/lib/learning-content";
import { buildMapQuizQuestions } from "@/lib/map-quiz";
import { saveQuizResult } from "@/lib/progress-store";
import { stringifySkillIds } from "@/lib/session";
import { LearningCardItem, QuizAnswer, SkillId } from "@/lib/types";
import { skillTitle } from "@/lib/quiz";

type MapQuizSessionProps = {
  items: LearningCardItem[];
  selectedSkillIds: SkillId[];
  questionCount: number;
  stepSeconds: number;
};

export function MapQuizSession({
  items,
  selectedSkillIds,
  questionCount,
  stepSeconds,
}: MapQuizSessionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sessionSeed] = useState(() => crypto.randomUUID());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<QuizAnswer | null>(null);
  const [revealedAnswersSnapshot, setRevealedAnswersSnapshot] = useState<QuizAnswer[] | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(stepSeconds);

  const questions = useMemo(
    () => buildMapQuizQuestions(items, questionCount, sessionSeed),
    [items, questionCount, sessionSeed],
  );
  const question = questions[currentIndex];

  const finishQuiz = useCallback(
    (nextAnswers: QuizAnswer[]) => {
      const score = nextAnswers.filter((entry) => entry.isCorrect).length;
      const result = {
        mode: "map-quiz" as const,
        selectedSkillIds,
        score,
        total: questions.length,
        answers: nextAnswers,
      };

      saveQuizResult(result);

      startTransition(() => {
        router.push(
          `/results?mode=map-quiz&skills=${stringifySkillIds(selectedSkillIds)}&score=${score}&total=${questions.length}`,
        );
      });
    },
    [questions.length, router, selectedSkillIds, startTransition],
  );

  const moveToNextQuestion = useCallback(
    (nextAnswers: QuizAnswer[]) => {
      if (currentIndex < questions.length - 1) {
        setSelectedOptionIndex(null);
        setSecondsLeft(stepSeconds);
        setRevealedAnswer(null);
        setRevealedAnswersSnapshot(null);
        setCurrentIndex((index) => index + 1);
        return;
      }

      finishQuiz(nextAnswers);
    },
    [currentIndex, finishQuiz, questions.length, stepSeconds],
  );

  const settleQuestion = useCallback(
    (optionId: string) => {
      if (revealedAnswer || !question) {
        return;
      }

      const answer: QuizAnswer = {
        questionId: question.id,
        itemId: question.itemId,
        skillId: question.skillId,
        selectedOptionId: optionId,
        correctOptionId: question.correctOptionId,
        isCorrect: optionId === question.correctOptionId,
      };

      setRevealedAnswer(answer);
      const nextAnswers = [...answers, answer];
      setAnswers(nextAnswers);
      setRevealedAnswersSnapshot(nextAnswers);
    },
    [answers, question, revealedAnswer],
  );

  const closeDetails = useCallback(() => {
    if (!revealedAnswer) {
      return;
    }

    moveToNextQuestion(revealedAnswersSnapshot ?? answers);
  }, [answers, moveToNextQuestion, revealedAnswer, revealedAnswersSnapshot]);

  useEffect(() => {
    if (!question) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (revealedAnswer) {
        if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
          event.preventDefault();
          closeDetails();
        }
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedOptionIndex((current) =>
          current === null ? 0 : (current + 1) % question.options.length,
        );
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelectedOptionIndex((current) =>
          current === null ? question.options.length - 1 : (current - 1 + question.options.length) % question.options.length,
        );
      }

      if ((event.key === "Enter" || event.key === " ") && selectedOptionIndex !== null) {
        event.preventDefault();
        settleQuestion(question.options[selectedOptionIndex].id);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        router.push("/");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDetails, question, revealedAnswer, router, selectedOptionIndex, settleQuestion]);

  useEffect(() => {
    if (!autoMode || !question || revealedAnswer) {
      return;
    }

    const tick = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(tick);
          settleQuestion("");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [autoMode, question, revealedAnswer, settleQuestion]);

  if (!question) {
    return (
      <section className="rounded-[2rem] bg-white p-8 paper-shadow">
        <p className="text-lg font-semibold text-slate-700">
          Map quiz is ready for Countries and Continents.
        </p>
      </section>
    );
  }

  function optionClass(optionId: string, index: number): string {
    if (revealedAnswer) {
      if (optionId === question.correctOptionId) {
        return "border-emerald-500 bg-emerald-100 text-emerald-950";
      }

      if (optionId === revealedAnswer.selectedOptionId && optionId !== question.correctOptionId) {
        return "border-rose-500 bg-rose-100 text-rose-950";
      }
    }

    if (index === selectedOptionIndex) {
      return "border-sky-500 bg-sky-50 text-slate-950";
    }

    return "border-white/80 bg-white text-slate-900";
  }

  const currentItem = items.find((item) => item.id === question.itemId && item.skillId === question.skillId);
  const displayFields = currentItem ? getDisplayFieldLines(currentItem).slice(0, 6) : [];
  const description = currentItem ? buildDescription(currentItem) : "";
  const funFacts = currentItem ? buildFunFacts(currentItem).slice(0, 3) : [];
  const badge = currentItem ? getItemBadge(currentItem) : "";

  if (!currentItem) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] bg-white/70 px-4 py-3 paper-shadow backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-900"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            Exit Map Quiz
          </button>
          <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
            {selectedSkillIds.map(skillTitle).join(" + ")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoMode((current) => !current)}
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
              autoMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
            }`}
          >
            Auto {autoMode ? "On" : "Off"}
          </button>
          <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      <TimerProgress
        active={autoMode}
        label="Map quiz timer"
        secondsLeft={secondsLeft}
        totalSeconds={stepSeconds}
      />

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
        <GeographyMap item={currentItem} />

        <section className="rounded-[2rem] bg-white/90 p-6 paper-shadow backdrop-blur">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Visual Geography
          </div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{question.prompt}</h2>
          <p className="mt-3 text-sm font-semibold text-slate-600">{question.promptHint}</p>
          <div className="mt-4 rounded-[1.5rem] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {question.hint}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {question.options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                disabled={Boolean(revealedAnswer)}
                onClick={() => settleQuestion(option.id)}
                className={`min-h-20 rounded-[1.4rem] border px-4 py-4 text-left text-lg font-black transition ${optionClass(option.id, index)}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-5 text-sm font-semibold text-slate-500">
            {isPending
              ? "Finishing up your results..."
              : revealedAnswer
                ? "Close the detail popup when you're ready for the next question."
                : "Use the map first, then let the hint help you confirm."}
          </div>
        </section>
      </div>

      {revealedAnswer ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={currentItem.skillId === "countries" ? "Country details" : "Continent details"}
            className="my-auto flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
          >
            <div className="border-b border-slate-200 bg-gradient-to-r from-amber-50 via-white to-emerald-50 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className={`text-lg font-black ${
                      revealedAnswer.isCorrect ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {revealedAnswer.isCorrect ? `Yes, that is ${currentItem.name}.` : `This one was ${currentItem.name}.`}
                  </div>
                  <div className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {currentItem.skillId === "countries" ? "Country Details" : "Continent Details"}
                  </div>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">{currentItem.name}</h3>
                  {description ? (
                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                      {description}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {badge ? (
                    <div className="rounded-full bg-white px-4 py-2 text-2xl shadow-sm">{badge}</div>
                  ) : null}
                  <button
                    type="button"
                    onClick={closeDetails}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 overscroll-contain">
              {displayFields.length > 0 ? (
                <div className="grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-2">
                  {displayFields.map((field) => (
                    <div key={field.label} className="rounded-[1rem] bg-slate-50 px-3 py-3">
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                        {field.label}
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{field.value}</div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-4 pt-5 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Quick Facts
                  </div>
                  <div className="mt-3 grid gap-2">
                    {question.revealFacts.map((fact) => (
                      <div
                        key={fact}
                        className="rounded-[1.1rem] bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        {fact}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Learn More
                  </div>
                  <div className="mt-3 grid gap-2">
                    {[...currentItem.facts.slice(0, 3), ...funFacts].slice(0, 4).map((fact) => (
                      <div
                        key={fact}
                        className="rounded-[1.1rem] bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                      >
                        {fact}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
