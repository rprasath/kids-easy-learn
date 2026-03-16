"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { supportsMapQuiz } from "@/lib/map-skills";
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
const TIME_OPTIONS = [10, 15, 20, 30, 45, 60, 120];

export function SessionBuilder({ itemCounts, skills }: SessionBuilderProps) {
  const router = useRouter();
  const [selectedSkillIds, setSelectedSkillIds] = useState<SkillId[]>(
    () => readSessionSelection()?.selectedSkillIds ?? [getDefaultSkillId()],
  );
  const [stepSeconds, setStepSeconds] = useState(60);

  const canStart = selectedSkillIds.length > 0;
  const skillQuery = stringifySkillIds(selectedSkillIds);
  const hasMapSupportedSkill = selectedSkillIds.some((skillId) => supportsMapQuiz(skillId));
  const hasMapUnsupportedSkill = selectedSkillIds.some((skillId) => !supportsMapQuiz(skillId));
  const canStartMapQuiz = canStart && hasMapSupportedSkill && !hasMapUnsupportedSkill;

  function toggleSkill(skillId: SkillId) {
    setSelectedSkillIds((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
    );
  }

  function remember(mode: "flashcards" | "quiz" | "map-quiz") {
    saveSessionSelection(selectedSkillIds, mode);
  }

  async function startMode(mode: "flashcards" | "quiz" | "map-quiz") {
    if (!canStart || (mode === "map-quiz" && !canStartMapQuiz)) {
      return;
    }

    remember(mode);

    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Some browsers may still deny the request; navigation should continue.
    }

    const href =
      mode === "flashcards"
        ? `/learn?skills=${skillQuery}&seconds=${stepSeconds}`
        : mode === "quiz"
          ? `/quiz?skills=${skillQuery}&count=10&seconds=${stepSeconds}`
          : `/map-quiz?skills=${skillQuery}&count=10&seconds=${stepSeconds}`;

    router.push(href as Route);
  }

  function skillLine(skill: SkillDefinition) {
    const itemCount = itemCounts[skill.id] ?? 0;
    const label = itemCount === 1 ? skill.itemLabel : `${skill.itemLabel}s`;
    return `${itemCount} ${label} to explore`;
  }

  return (
    <section className="flex flex-1 items-start justify-center">
      <div className="w-full px-1 py-2 sm:py-4">
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
                className={`rounded-[1.6rem] border px-5 py-5 text-left transition ${
                  selected
                    ? `border-slate-900/80 bg-gradient-to-br ${
                        accentByTheme[skill.theme.accent] ?? "from-slate-100 to-white"
                      } text-slate-900`
                    : `border-white/0 bg-white/40 text-slate-900 hover:border-slate-300/80 hover:bg-white/65`
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
                    className={`inline-flex min-w-[3.2rem] items-center justify-center rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.14em] ${
                      selected ? "bg-slate-900 text-white" : "bg-white/85 text-slate-700"
                    }`}
                  >
                    {selected ? "Ready" : "Pick"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <section className="mt-8 border-t border-slate-200/80 pt-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                {selectedSkillIds.length} game{selectedSkillIds.length === 1 ? "" : "s"} ready
              </div>
              <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700">
                Timer
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

            <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:max-w-5xl">
              <button
                type="button"
                onClick={() => void startMode("flashcards")}
                disabled={!canStart}
                className={`rounded-[1.55rem] px-6 py-5 text-left ${
                  canStart
                    ? "bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(242,139,69,0.18)]"
                    : "pointer-events-none bg-slate-200 text-slate-400"
                }`}
              >
                <div className="text-xs font-black uppercase tracking-[0.18em]">Play</div>
                <div className="mt-2 text-3xl font-black">Start Flashcards</div>
              </button>

              <button
                type="button"
                onClick={() => void startMode("quiz")}
                disabled={!canStart}
                className={`rounded-[1.55rem] px-6 py-5 text-left ${
                  canStart
                    ? "bg-[#dce9f2] text-slate-900 shadow-[0_10px_22px_rgba(114,154,183,0.12)]"
                    : "pointer-events-none bg-white/70 text-slate-300 ring-1 ring-slate-200"
                }`}
              >
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Play</div>
                <div className="mt-2 text-3xl font-black">Start Quiz</div>
              </button>

              <button
                type="button"
                onClick={() => void startMode("map-quiz")}
                disabled={!canStartMapQuiz}
                className={`rounded-[1.55rem] px-6 py-5 text-left ${
                  canStartMapQuiz
                    ? "bg-[#dff4e8] text-slate-900 shadow-[0_10px_22px_rgba(77,154,111,0.16)]"
                    : "pointer-events-none bg-white/70 text-slate-300 ring-1 ring-slate-200"
                }`}
              >
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Explore</div>
                <div className="mt-2 text-3xl font-black">Start Map Quiz</div>
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm font-semibold text-slate-600">
            {hasMapUnsupportedSkill
              ? "Map quiz is ready for Countries and Continents."
              : "All three modes are ready whenever you are."}
          </div>
        </section>
      </div>
    </section>
  );
}
