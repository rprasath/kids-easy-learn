import { SkillId } from "@/lib/types";

export const MAP_QUIZ_SKILL_IDS: SkillId[] = ["continents", "countries"];

export function supportsMapQuiz(skillId: SkillId): boolean {
  return MAP_QUIZ_SKILL_IDS.includes(skillId);
}

export function filterMapQuizSkillIds(skillIds: SkillId[]): SkillId[] {
  return skillIds.filter(supportsMapQuiz);
}
