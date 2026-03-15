"use client";

import Link from "next/link";
import { useState } from "react";

import { readSessionSelection, saveSessionSelection } from "@/lib/progress-store";
import { getDefaultSkillId } from "@/lib/skill-catalog";
import { stringifySkillIds } from "@/lib/session";
import { SkillDefinition, SkillId } from "@/lib/types";

type SessionBuilderProps = {
  itemCounts: Record<string, number>;
  skills: SkillDefinition[];
};

const accentByTheme: Record<string, string> = {
  blue: "from-sky-200 via-cyan-50 to-indigo-100",
  green: "from-emerald-200 via-lime-50 to-teal-100",
  amber: "from-amber-200 via-yellow-50 to-rose-100",
};
const TIME_OPTIONS = [10, 15, 20, 30, 45, 60];

export function SessionBuilder({ itemCounts, skills }: SessionBuilderProps) {
  const [selectedSkillIds, setSelectedSkillIds] = useState<SkillId[]>(
    () => readSessionSelection()?.selectedSkillIds ?? [getDefaultSkillId()],
  );
  const [stepSeconds, setStepSeconds] = useState(20);

  const canStart = selectedSkillIds.length > 0;
  const skillQuery = stringifySkillIds(selectedSkillIds);

  function toggleSkill(skillId: SkillId) {
    setSelectedSkillIds((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
    );
  }

  function remember(mode: "flashcards" | "quiz") {
    saveSessionSelection(selectedSkillIds, mode);
  }

  function skillLine(skill: SkillDefinition) {
    const itemCount = itemCounts[skill.id] ?? 0;
    const label = itemCount === 1 ? skill.itemLabel : `${skill.itemLabel}s`;
    return `${itemCount} ${label} to explore`;
  }

  return (
    <section className="flex flex-1 items-start justify-center">
      <div className="w-full rounded-[2.25rem] bg-white/88 p-5 paper-shadow backdrop-blur sm:p-7">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">Start Here</p>
          <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-5xl">
            What do you want to play?
          </h1>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            Pick one or more geography games, then tap the big button to start.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {skills.map((skill) => {
            const selected = selectedSkillIds.includes(skill.id);

            return (
              <button
                key={skill.id}
                type="button"
                aria-pressed={selected}
                aria-label={`Select ${skill.title}`}
                onClick={() => toggleSkill(skill.id)}
                className={`rounded-[1.9rem] border-2 p-5 text-left transition ${
                  selected
                    ? `border-slate-900 bg-gradient-to-br ${
                        accentByTheme[skill.theme.accent] ?? "from-slate-200 via-white to-slate-100"
                      } text-slate-900 shadow-[0_18px_40px_rgba(25,50,74,0.14)]`
                    : `border-transparent bg-gradient-to-br ${
                        accentByTheme[skill.theme.accent] ?? "from-slate-200 via-white to-slate-100"
                      } shadow-[0_10px_24px_rgba(25,50,74,0.08)]`
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                      {skillLine(skill)}
                    </div>
                    <h3 className="mt-2 text-2xl font-black">{skill.title}</h3>
                    <p className={`mt-2 text-sm ${selected ? "text-slate-800" : "text-slate-600"}`}>
                      {selected ? "Ready to play." : "Tap to add this game."}
                    </p>
                  </div>
                  <span
                    className={`inline-flex min-w-[3.2rem] items-center justify-center rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-sm ${
                      selected ? "bg-slate-900 text-white" : "bg-white/75 text-slate-700"
                    }`}
                  >
                    {selected ? "Ready" : "Pick"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <section className="mt-8 rounded-[2rem] bg-[linear-gradient(145deg,#f9fbff_0%,#eef8ff_55%,#fff4e7_100%)] p-4 shadow-[0_16px_34px_rgba(25,50,74,0.08)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-white">
                {selectedSkillIds.length} game{selectedSkillIds.length === 1 ? "" : "s"} ready
              </div>
              <label className="flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                Timer
                <select
                  value={stepSeconds}
                  onChange={(event) => setStepSeconds(Number(event.target.value))}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-900 outline-none"
                >
                  {TIME_OPTIONS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds}s
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:min-w-[28rem]">
              <Link
                href={canStart ? `/learn?skills=${skillQuery}&seconds=${stepSeconds}` : "/"}
                onClick={() => remember("flashcards")}
                className={`rounded-[1.7rem] px-6 py-5 text-left ${
                  canStart
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "pointer-events-none bg-slate-200 text-slate-400"
                }`}
              >
                <div className="text-xs font-black uppercase tracking-[0.18em]">Play</div>
                <div className="mt-2 text-3xl font-black">Start Flashcards</div>
              </Link>

              <Link
                href={canStart ? `/quiz?skills=${skillQuery}&count=10&seconds=${stepSeconds}` : "/"}
                onClick={() => remember("quiz")}
                className={`rounded-[1.7rem] px-5 py-5 text-left ${
                  canStart
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "pointer-events-none bg-white/70 text-slate-300 ring-1 ring-slate-200"
                }`}
              >
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Also Try</div>
                <div className="mt-2 text-xl font-black">Start Quiz</div>
              </Link>
            </div>
          </div>

          <div className="mt-4 text-sm font-semibold text-slate-600">
            Flashcards start first so kids can warm up with clues before the quiz.
          </div>
        </section>
      </div>
    </section>
  );
}
