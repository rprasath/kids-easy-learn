"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { readSessionSelection, saveSessionSelection } from "@/lib/progress-store";
import { SkillDefinition, SkillId } from "@/lib/types";

type SessionBuilderProps = {
  itemCounts: Record<string, number>;
  skills: SkillDefinition[];
};

type SetupMode = "map-learn" | "quiz" | "flashcards";

const TIME_OPTIONS = [10, 15, 20, 30, 45, 60, 120];
const MODE_CONFIG: Record<
  SetupMode,
  {
    eyebrow: string;
    title: string;
    description: string;
    buttonTone: string;
    actionLabel: string;
  }
> = {
  "map-learn": {
    eyebrow: "Learn",
    title: "Explore the map",
    description: "Click countries on the world map and open rich country details.",
    buttonTone: "bg-[linear-gradient(135deg,#dff3ea_0%,#f7fcfa_55%,#dbeef7_100%)] text-slate-900",
    actionLabel: "Start Learn",
  },
  quiz: {
    eyebrow: "Quiz",
    title: "Answer and practice",
    description: "Take a quick multiple-choice round with one topic at a time.",
    buttonTone: "bg-[linear-gradient(135deg,#dce9f2_0%,#f6fbff_55%,#eef5fb_100%)] text-slate-900",
    actionLabel: "Start Quiz",
  },
  flashcards: {
    eyebrow: "Flashcards",
    title: "Flip through clues",
    description: "Study one topic with clue cards, details, and favorites.",
    buttonTone: "bg-[linear-gradient(135deg,#ffe6cf_0%,#fff7ed_55%,#fff1df_100%)] text-slate-900",
    actionLabel: "Start Flashcards",
  },
};

export function SessionBuilder({ itemCounts, skills }: SessionBuilderProps) {
  const router = useRouter();
  const rememberedSelection = readSessionSelection();
  const rememberedSkillId = rememberedSelection?.selectedSkillIds[0] ?? null;
  const [selectedMode, setSelectedMode] = useState<SetupMode | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId | null>(rememberedSkillId);
  const [stepSeconds, setStepSeconds] = useState(60);
  const [autoMode, setAutoMode] = useState(true);

  const availableSkills = useMemo(() => {
    if (!selectedMode) {
      return [];
    }

    return skills.filter((skill) => skill.supportedModes.includes(selectedMode));
  }, [selectedMode, skills]);

  const selectedSkill = availableSkills.find((skill) => skill.id === selectedSkillId) ?? null;
  const currentStep = !selectedMode ? 1 : !selectedSkill ? 2 : 3;

  function chooseMode(mode: SetupMode) {
    setSelectedMode(mode);
    setSelectedSkillId(null);
  }

  function goBack() {
    if (currentStep === 3) {
      setSelectedSkillId(null);
      return;
    }

    if (currentStep === 2) {
      setSelectedMode(null);
    }
  }

  function buildHref(mode: SetupMode, skillId: SkillId): string {
    const params = new URLSearchParams({
      skills: skillId,
      seconds: String(stepSeconds),
      auto: autoMode ? "1" : "0",
    });

    if (mode === "quiz") {
      params.set("count", "10");
      return `/quiz?${params.toString()}`;
    }

    if (mode === "flashcards") {
      return `/learn?${params.toString()}`;
    }

    return `/map-learn?${params.toString()}`;
  }

  async function startSelectedFlow() {
    if (!selectedMode || !selectedSkill) {
      return;
    }

    saveSessionSelection([selectedSkill.id], selectedMode);

    if (selectedMode !== "map-learn") {
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {
        // Continue to the selected mode even if fullscreen is blocked.
      }
    }

    router.push(buildHref(selectedMode, selectedSkill.id) as Route);
  }

  function skillSummary(skill: SkillDefinition) {
    const count = itemCounts[skill.id] ?? 0;
    const label = count === 1 ? skill.itemLabel : `${skill.itemLabel}s`;
    return `${count} ${label}`;
  }

  return (
    <section className="flex flex-1 items-start justify-center">
      <div className="w-full max-w-4xl px-1 py-2 sm:py-6">
        <div className="rounded-[2rem] bg-white/90 p-6 paper-shadow backdrop-blur sm:p-8">
          <div className="text-center">
            <div className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">Start Simple</div>
            <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-5xl">
              Pick a mode, choose a skill, and begin
            </h1>
            <p className="mt-3 text-base font-semibold text-slate-600 sm:text-lg">
              One clear step at a time.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((step) => {
              const active = step === currentStep;
              const done = step < currentStep;

              return (
                <div
                  key={step}
                  className={`rounded-[1.4rem] border px-4 py-4 text-center ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.18em]">Step {step}</div>
                  <div className="mt-1 text-lg font-black">
                    {step === 1 ? "Mode" : step === 2 ? "Skill" : "Setup"}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedMode ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[1.3rem] bg-slate-50 px-4 py-3">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                {MODE_CONFIG[selectedMode].eyebrow}
              </span>
              {selectedSkill ? (
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                  {selectedSkill.title}
                </span>
              ) : null}
            </div>
          ) : null}

          {currentStep === 1 ? (
            <section className="mt-8">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Step 1</div>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Choose how you want to play</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {(Object.entries(MODE_CONFIG) as Array<[SetupMode, (typeof MODE_CONFIG)[SetupMode]]>).map(
                  ([mode, config]) => (
                    <button
                      key={mode}
                      type="button"
                      aria-label={`Choose ${config.eyebrow}`}
                      onClick={() => chooseMode(mode)}
                      className={`rounded-[1.7rem] px-5 py-6 text-left shadow-[0_10px_25px_rgba(15,23,42,0.08)] ${config.buttonTone}`}
                    >
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        {config.eyebrow}
                      </div>
                      <div className="mt-3 text-3xl font-black">{config.title}</div>
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{config.description}</p>
                    </button>
                  ),
                )}
              </div>
            </section>
          ) : null}

          {currentStep === 2 && selectedMode ? (
            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Step 2</div>
                  <h2 className="mt-2 text-3xl font-black text-slate-900">Choose one skill</h2>
                </div>
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700"
                >
                  Back
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {availableSkills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    aria-label={`Select ${skill.title}`}
                    onClick={() => setSelectedSkillId(skill.id)}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {skillSummary(skill)}
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900">{skill.title}</div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{skill.description}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {currentStep === 3 && selectedMode && selectedSkill ? (
            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Step 3</div>
                  <h2 className="mt-2 text-3xl font-black text-slate-900">Set your round and start</h2>
                </div>
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700"
                >
                  Back
                </button>
              </div>

              <div className="mt-5 rounded-[1.7rem] bg-slate-50 p-5">
                <div className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                  {selectedSkill.title}
                </div>
                <div className="mt-1 text-2xl font-black text-slate-900">{MODE_CONFIG[selectedMode].title}</div>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {selectedMode === "map-learn"
                    ? "Learn mode opens the interactive world map for this skill."
                    : "Choose the timer and whether the round should advance automatically."}
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Timer</div>
                    <select
                      aria-label="Timer"
                      value={stepSeconds}
                      onChange={(event) => setStepSeconds(Number(event.target.value))}
                      className="mt-2 w-full bg-transparent text-lg font-black text-slate-900 outline-none"
                    >
                      {TIME_OPTIONS.map((seconds) => (
                        <option key={seconds} value={seconds}>
                          {seconds} seconds
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                    <input
                      type="checkbox"
                      checked={autoMode}
                      onChange={(event) => setAutoMode(event.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-slate-900"
                    />
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                        Auto Mode
                      </div>
                      <div className="mt-1 text-base font-black text-slate-900">
                        {autoMode ? "On" : "Off"}
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => void startSelectedFlow()}
                  className="mt-5 rounded-[1.5rem] bg-slate-900 px-6 py-5 text-left text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]"
                >
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                    {MODE_CONFIG[selectedMode].eyebrow}
                  </div>
                  <div className="mt-2 text-3xl font-black">{MODE_CONFIG[selectedMode].actionLabel}</div>
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
