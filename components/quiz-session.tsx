"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useStudyChrome } from "@/components/focus-shell";
import { TimerProgress } from "@/components/timer-progress";
import { saveQuizResult } from "@/lib/progress-store";
import { buildQuizQuestions, skillLabel, skillTitle } from "@/lib/quiz";
import { stringifySkillIds } from "@/lib/session";
import { LearningCardItem, QuizAnswer, SkillId } from "@/lib/types";

type QuizSessionProps = {
  items: LearningCardItem[];
  selectedSkillIds: SkillId[];
  questionCount: number;
  stepSeconds: number;
};

const TIMER_OPTIONS = [15, 30, 45, 60, 120];

export function QuizSession({ items, selectedSkillIds, questionCount, stepSeconds }: QuizSessionProps) {
  const router = useRouter();
  const { theme } = useStudyChrome();
  const [isPending, startTransition] = useTransition();
  const [sessionSeed] = useState(() => crypto.randomUUID());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<QuizAnswer | null>(null);
  const [autoMode, setAutoMode] = useState(true);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(stepSeconds);
  const [secondsLeft, setSecondsLeft] = useState(stepSeconds);

  const questions = useMemo(
    () => buildQuizQuestions(items, questionCount, sessionSeed),
    [items, questionCount, sessionSeed],
  );
  const question = questions[currentIndex];

  const finishQuiz = useCallback(
    (nextAnswers: QuizAnswer[]) => {
      const score = nextAnswers.filter((entry) => entry.isCorrect).length;
      const result = {
        selectedSkillIds,
        score,
        total: questions.length,
        answers: nextAnswers,
      };

      saveQuizResult(result);

      startTransition(() => {
        router.push(
          `/results?mode=quiz&skills=${stringifySkillIds(selectedSkillIds)}&score=${score}&total=${questions.length}`,
        );
      });
    },
    [questions.length, router, selectedSkillIds, startTransition],
  );

  const moveToNextQuestion = useCallback(
    (nextAnswers: QuizAnswer[]) => {
      if (currentIndex < questions.length - 1) {
        setSelectedOptionIndex(null);
        setSecondsLeft(secondsPerQuestion);
        setRevealedAnswer(null);
        setCurrentIndex((index) => index + 1);
        return;
      }

      finishQuiz(nextAnswers);
    },
    [currentIndex, finishQuiz, questions.length, secondsPerQuestion],
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

      window.setTimeout(() => {
        moveToNextQuestion(nextAnswers);
      }, 1200);
    },
    [answers, moveToNextQuestion, question, revealedAnswer],
  );

  const answerQuestion = useCallback(
    (optionId: string) => {
      settleQuestion(optionId);
    },
    [settleQuestion],
  );

  useEffect(() => {
    if (!question) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (revealedAnswer) {
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
        answerQuestion(question.options[selectedOptionIndex].id);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        router.push("/");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerQuestion, question, revealedAnswer, router, selectedOptionIndex]);

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
  }, [autoMode, question, question?.id, revealedAnswer, secondsPerQuestion, settleQuestion]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = autoMode ? "hidden" : "";
    document.documentElement.style.overflow = autoMode ? "hidden" : "";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [autoMode]);

  if (!question) {
    return (
      <section className="rounded-[2rem] bg-white p-8 paper-shadow">
        <p className="text-lg font-semibold text-slate-700">
          We could not build a quiz from this selection.
        </p>
      </section>
    );
  }

  function optionClass(optionId: string, index: number): string {
    if (revealedAnswer) {
      if (optionId === question.correctOptionId) {
        return "border-emerald-500 bg-emerald-50 text-emerald-950";
      }

      if (optionId === revealedAnswer.selectedOptionId && optionId !== question.correctOptionId) {
        return "border-rose-500 bg-rose-50 text-rose-950";
      }
    }

    if (index === selectedOptionIndex) {
      return "border-sky-500 bg-sky-50 text-slate-950";
    }

    return theme === "dark"
      ? "border-slate-600 bg-slate-900/75 text-slate-100"
      : "border-slate-200 bg-white/70 text-slate-900";
  }

  const isDark = theme === "dark";
  const borderTone = isDark ? "border-slate-700" : "border-slate-300";
  const ghostButton = isDark
    ? "border-slate-600 bg-slate-900/80 text-slate-100"
    : "border-slate-400 bg-white text-slate-900";
  const mutedTone = isDark ? "text-slate-300" : "text-slate-600";
  const subtleTone = isDark ? "text-slate-200" : "text-slate-700";
  const accentTone = isDark ? "text-sky-300" : "text-sky-800";
  const textTone = isDark ? "text-slate-100" : "text-slate-900";
  const contentTone = isDark ? "text-slate-200" : "text-slate-800";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl flex-col">
      <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 border-b px-1 pb-3 ${borderTone}`}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            Exit Quiz
          </button>
          <span className={`text-xs font-black uppercase tracking-[0.18em] ${mutedTone}`}>
            {selectedSkillIds.map(skillTitle).join(" + ")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] ${ghostButton}`}>
            Timer
            <select
              value={secondsPerQuestion}
              onChange={(event) => {
                const nextSeconds = Number(event.target.value);
                setSecondsPerQuestion(nextSeconds);
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
              setSecondsLeft(secondsPerQuestion);
              setRevealedAnswer(null);
            }}
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
              autoMode ? "bg-[var(--accent)] text-white" : ghostButton
            }`}
          >
            {autoMode ? "Auto On" : "Auto Mode"}
          </button>
        </div>
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <p className={`text-sm font-black uppercase tracking-[0.22em] ${accentTone}`}>Quiz Mode</p>
            <h2 className={`mt-1 text-3xl font-black ${textTone}`}>
              Question {currentIndex + 1} of {questions.length}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-sm font-bold ${subtleTone}`}>
              {autoMode ? `Answer reveals in ${secondsLeft}s` : "Use ← → to choose, Enter to answer"}
            </div>
          </div>
        </div>

        <TimerProgress
          active={autoMode}
          label="Quiz timer"
          secondsLeft={secondsLeft}
          totalSeconds={secondsPerQuestion}
        />

        <div className="flex min-h-[72vh] flex-1 flex-col px-1 py-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black uppercase tracking-[0.2em] ${accentTone}`}>
              {skillLabel(question.skillId)}
            </span>
            <span className={`text-sm font-black uppercase tracking-[0.12em] ${mutedTone}`}>
              {currentIndex + 1}/{questions.length}
            </span>
          </div>

          <div className="mt-8 text-center">
            <h3 className={`mx-auto max-w-4xl text-4xl font-black leading-tight sm:text-6xl ${textTone}`}>
              {question.prompt}
            </h3>
            <p className={`mx-auto mt-4 max-w-3xl text-lg leading-8 sm:text-xl sm:leading-9 ${contentTone}`}>
              {question.promptHint}
            </p>
          </div>

          <div className="mt-10 grid flex-1 gap-4 sm:grid-cols-2">
            {question.options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => answerQuestion(option.id)}
                disabled={isPending || Boolean(revealedAnswer)}
                className={`min-h-28 rounded-[1.6rem] border-2 px-6 py-6 text-left text-2xl font-black shadow-[0_6px_18px_rgba(25,50,74,0.05)] transition ${optionClass(option.id, index)} disabled:cursor-default`}
              >
                <span className="mr-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm text-white">
                  {String.fromCharCode(65 + index)}
                </span>
                {option.label}
              </button>
            ))}
          </div>

          <div className={`mt-6 flex flex-wrap items-center justify-center gap-3 border-t pt-5 ${borderTone}`}>
            <button
              type="button"
              onClick={() =>
                setSelectedOptionIndex((current) =>
                  current === null ? question.options.length - 1 : (current - 1 + question.options.length) % question.options.length,
                )
              }
              className={`rounded-full border px-6 py-3 text-sm font-black uppercase tracking-[0.18em] ${ghostButton}`}
            >
              ← Left
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedOptionIndex === null) {
                  return;
                }

                answerQuestion(question.options[selectedOptionIndex].id);
              }}
              disabled={Boolean(revealedAnswer) || selectedOptionIndex === null}
              className="rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-black uppercase tracking-[0.18em] text-white disabled:opacity-60"
            >
              Check Answer
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedOptionIndex((current) =>
                  current === null ? 0 : (current + 1) % question.options.length,
                )
              }
              className={`rounded-full border px-6 py-3 text-sm font-black uppercase tracking-[0.18em] ${ghostButton}`}
            >
              Right →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
