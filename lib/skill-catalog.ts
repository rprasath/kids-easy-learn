import skillsData from "@/data/skills/skills.json";
import { SkillDefinition, SkillId } from "@/lib/types";

const skillCatalog = skillsData as SkillDefinition[];

export function listSkillDefinitions(): SkillDefinition[] {
  return skillCatalog;
}

export function getSkillDefinition(skillId: SkillId): SkillDefinition | undefined {
  return skillCatalog.find((skill) => skill.id === skillId);
}

export function getSkillIds(): SkillId[] {
  return skillCatalog.map((skill) => skill.id);
}

export function getDefaultSkillId(): SkillId {
  return skillCatalog[0]?.id ?? "states";
}
