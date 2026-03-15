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

  const selectedSkills = skills.filter((skill) => selectedSkillIds.includes(skill.id));

  return (
    <section className="flex flex-1 items-start justify-center">
      <div className="w-full max-w-6xl rounded-[2.6rem] bg-white/92 p-6 paper-shadow backdrop-blur sm:p-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-700">Dashboard</p>
          <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
            Pick the geography skills we want, then jump straight into cards or quiz mode.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Choose one skill or mix several. Then set the time for each card or question before we start.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {selectedSkills.map((skill) => (
            <span key={skill.id} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              {skill.title}
            </span>
          ))}
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {selectedSkillIds.length} selected
          </span>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedSkillIds(skills.map((skill) => skill.id))}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => setSelectedSkillIds([getDefaultSkillId()])}
            className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-orange-900"
          >
            Reset
          </button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {skills.map((skill) => {
            const selected = selectedSkillIds.includes(skill.id);
            const previewFields = skill.fields.slice(0, 3).map((field) => field.label.toLowerCase());

            return (
              <button
                key={skill.id}
                type="button"
                aria-pressed={selected}
                aria-label={`Select ${skill.title}`}
                onClick={() => toggleSkill(skill.id)}
                className={`rounded-[1.75rem] border-2 p-5 text-left transition ${
                  selected
                    ? `border-slate-900 bg-gradient-to-br ${
                        accentByTheme[skill.theme.accent] ?? "from-slate-200 via-white to-slate-100"
                      } text-slate-900 shadow-xl`
                    : `border-transparent bg-gradient-to-br ${
                        accentByTheme[skill.theme.accent] ?? "from-slate-200 via-white to-slate-100"
                      }`
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                      {itemCounts[skill.id] ?? 0} items
                    </div>
                    <h3 className="mt-2 text-2xl font-black">{skill.title}</h3>
                    <p className={`mt-2 text-sm ${selected ? "text-slate-700" : "text-slate-600"}`}>
                      {skill.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                      {previewFields.map((field) => (
                        <span key={field} className="rounded-full bg-white/70 px-3 py-1">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`inline-flex min-w-[3.5rem] items-center justify-center rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.16em] shadow-sm ${
                      selected ? "bg-slate-900 text-white" : "bg-white/70 text-slate-700"
                    }`}
                  >
                    {selected ? "Selected" : "Add"}
                  </span>
                </div>
                <div className={`mt-5 text-sm font-semibold ${selected ? "text-slate-800" : "text-slate-600"}`}>
                  {selected
                    ? "This skill is already in our round."
                    : "Tap once to include this skill in the round."}
                </div>
              </button>
            );
          })}
        </div>

        <section className="mx-auto mt-8 w-full max-w-4xl rounded-[2.4rem] bg-slate-900 p-6 text-white paper-shadow">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-300">Start</p>
            <h2 className="mt-2 text-3xl font-black text-balance">
              Choose the time, then start learning
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/75">
              This time will be used for each flashcard step or quiz question.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <label className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white">
              Time per step
              <select
                value={stepSeconds}
                onChange={(event) => setStepSeconds(Number(event.target.value))}
                className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-900 outline-none"
              >
                {TIME_OPTIONS.map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds}s
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href={canStart ? `/learn?skills=${skillQuery}&seconds=${stepSeconds}` : "/"}
              onClick={() => remember("flashcards")}
              className={`rounded-[2rem] px-6 py-6 text-left ${
                canStart
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                  : "pointer-events-none bg-slate-700 text-slate-300"
              }`}
            >
              <div className="text-sm font-black uppercase tracking-[0.18em]">Learn</div>
              <div className="mt-2 text-3xl font-black">Start Flashcards</div>
              <div className="mt-2 text-sm text-white/85">
                See clue cards first, then flip into the full lesson in fullscreen.
              </div>
            </Link>

            <Link
              href={canStart ? `/quiz?skills=${skillQuery}&count=10&seconds=${stepSeconds}` : "/"}
              onClick={() => remember("quiz")}
              className={`rounded-[2rem] px-6 py-6 text-left ${
                canStart
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                  : "pointer-events-none bg-slate-700 text-slate-300"
              }`}
            >
              <div className="text-sm font-black uppercase tracking-[0.18em]">Practice</div>
              <div className="mt-2 text-3xl font-black">Start Quiz</div>
              <div className="mt-2 text-sm text-white/85">
                Get shuffled multiple-choice questions in fullscreen.
              </div>
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
