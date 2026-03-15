import { shuffleBySeed } from "@/lib/random";
import { getSkillDefinition } from "@/lib/skill-catalog";
import { LearningCardItem } from "@/lib/types";

function uniqueLines(lines: string[]): string[] {
  return Array.from(
    new Set(
      lines
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  );
}

export function buildDescription(item: LearningCardItem): string {
  return uniqueLines([item.description ?? "", ...item.facts])[0] ?? "";
}

export function buildFunFacts(item: LearningCardItem): string[] {
  return uniqueLines(item.funFacts ?? []).slice(0, 4);
}

export function buildLearningFacts(item: LearningCardItem): string[] {
  return uniqueLines(item.facts).slice(0, 10);
}

export function buildCluePool(item: LearningCardItem): string[] {
  return uniqueLines(item.clues);
}

export function pickStudyClues(
  item: LearningCardItem,
  count = 3,
  seed = item.id,
): string[] {
  return shuffleBySeed(buildCluePool(item), seed, (clue) => clue).slice(0, count);
}

export function pickQuizClue(item: LearningCardItem, seed = item.id): string {
  return pickStudyClues(item, 1, seed)[0] ?? "";
}

export function buildGuessClues(item: LearningCardItem): string[] {
  return pickStudyClues(item, 4, item.id);
}

export function getDisplayFieldLines(item: LearningCardItem): Array<{ label: string; value: string }> {
  const skill = getSkillDefinition(item.skillId);

  if (!skill) {
    throw new Error(`Unknown skill "${item.skillId}" while building display fields.`);
  }

  return skill.detailFieldKeys
    .map((fieldKey) => {
      const field = skill.fields.find((entry) => entry.key === fieldKey);
      const value = item.attributes[fieldKey];

      if (!field || !value) {
        return null;
      }

      return { label: field.label, value };
    })
    .filter((entry): entry is { label: string; value: string } => entry !== null);
}

export function getItemBadge(item: LearningCardItem): string {
  const skill = getSkillDefinition(item.skillId);

  if (!skill) {
    throw new Error(`Unknown skill "${item.skillId}" while building item badge.`);
  }

  return item.badge ?? (skill.badgeFieldKey ? item.attributes[skill.badgeFieldKey] : "") ?? "";
}

export function renderPromptTemplate(
  template: string,
  item: LearningCardItem,
  extra: Record<string, string> = {},
): string {
  const context: Record<string, string> = {
    name: item.name,
    ...item.attributes,
    ...extra,
  };

  return template.replace(/\{([^}]+)\}/g, (_, key: string) => context[key] ?? "");
}
