import { getDefaultSkillId, getSkillIds } from "@/lib/skill-catalog";
import { LearningSessionConfig, SkillId } from "@/lib/types";

const VALID_SKILLS: SkillId[] = getSkillIds();
const DEFAULT_SKILLS: SkillId[] = [getDefaultSkillId()];
const DEFAULT_COUNT = 10;
const DEFAULT_STEP_SECONDS = 60;

export function parseSkillIds(input: string | string[] | undefined): SkillId[] {
  const joined = Array.isArray(input) ? input.join(",") : input ?? "";
  const unique = new Set<SkillId>();

  joined
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      if (VALID_SKILLS.includes(value as SkillId)) {
        unique.add(value as SkillId);
      }
    });

  return Array.from(unique);
}

export function parseQuestionCount(input: string | string[] | undefined): number {
  const value = Array.isArray(input) ? input[0] : input;
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(parsed)) {
    return DEFAULT_COUNT;
  }

  return Math.max(5, Math.min(parsed, 20));
}

export function parsePositiveInt(
  input: string | string[] | undefined,
  fallback: number,
): number {
  const value = Array.isArray(input) ? input[0] : input;
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export function parseStepSeconds(input: string | string[] | undefined): number {
  const value = Array.isArray(input) ? input[0] : input;
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(parsed)) {
    return DEFAULT_STEP_SECONDS;
  }

  return Math.max(10, Math.min(parsed, 120));
}

export function buildSessionConfig(
  searchParams: Record<string, string | string[] | undefined>,
  mode: LearningSessionConfig["mode"],
): LearningSessionConfig {
  const selectedSkillIds = parseSkillIds(searchParams.skills);

  return {
    selectedSkillIds: selectedSkillIds.length > 0 ? selectedSkillIds : DEFAULT_SKILLS,
    mode,
    questionCount: parseQuestionCount(searchParams.count),
    stepSeconds: parseStepSeconds(searchParams.seconds),
    shuffle: true,
  };
}

export function stringifySkillIds(skillIds: SkillId[]): string {
  return skillIds.join(",");
}
