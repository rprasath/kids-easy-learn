"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

const TIMER_OPTIONS = [15, 30, 45, 60];

export function QuizSession({ items, selectedSkillIds, questionCount, stepSeconds }: QuizSessionProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [sessionSeed] = useState(() => crypto.randomUUID());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<QuizAnswer | null>(null);
  const [autoMode, setAutoMode] = useState(false);
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

  return (
    <div ref={containerRef} className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl flex-col">
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
            Exit Quiz
          </button>
          <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
            {selectedSkillIds.map(skillTitle).join(" + ")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-700">
            Timer
            <select
              value={secondsPerQuestion}
              onChange={(event) => {
                const nextSeconds = Number(event.target.value);
                setSecondsPerQuestion(nextSeconds);
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
              setSecondsLeft(secondsPerQuestion);
              setRevealedAnswer(null);
            }}
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
              autoMode ? "bg-orange-500 text-white" : "bg-white text-slate-900"
            }`}
          >
            {autoMode ? "Auto On" : "Auto Mode"}
          </button>
        </div>
      </div>

      <section className="mx-auto flex flex-1 w-full max-w-5xl flex-col items-center justify-center gap-4">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">Quiz Mode</p>
            <h2 className="mt-1 text-3xl font-black text-slate-900">
              Question {currentIndex + 1} of {questions.length}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow">
              {autoMode ? `Answer reveals in ${secondsLeft}s` : "Use ← → to choose, Enter to answer"}
            </div>
          </div>
        </div>

        <div className="w-full rounded-[2.8rem] bg-white/85 p-4 paper-shadow backdrop-blur sm:p-6">
          <div className="mx-auto flex min-h-[72vh] w-full max-w-4xl flex-col rounded-[2.6rem] bg-[linear-gradient(160deg,#fffaf3_0%,#fff7ec_52%,#eef8ff_100%)] p-6 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                {skillLabel(question.skillId)}
              </span>
              <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                {currentIndex + 1}/{questions.length}
              </span>
            </div>

            <div className="mt-8 text-center">
              <h3 className="text-4xl font-black text-slate-900 sm:text-5xl">{question.prompt}</h3>
              <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-slate-600">
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
                  className={`min-h-28 rounded-[2rem] border-2 px-6 py-6 text-left text-2xl font-black shadow-sm transition ${optionClass(option.id, index)} disabled:cursor-default`}
                >
                  <span className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm text-white">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedOptionIndex((current) =>
                    current === null ? question.options.length - 1 : (current - 1 + question.options.length) % question.options.length,
                  )
                }
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
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
                className="rounded-full bg-orange-500 px-7 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-orange-500/30 disabled:opacity-60"
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
                className="rounded-full bg-slate-200 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-900"
              >
                Right →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
