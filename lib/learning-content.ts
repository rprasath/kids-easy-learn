import { getSkillDefinition } from "@/lib/skill-catalog";
import { shuffleBySeed } from "@/lib/random";
import { LearningCardItem, SkillDefinition } from "@/lib/types";

function uniqueLines(lines: string[]): string[] {
  return Array.from(
    new Set(
      lines
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  );
}

function templateContext(item: LearningCardItem): Record<string, string> {
  return {
    name: item.name,
    ...item.attributes,
  };
}

function renderTemplate(template: string, item: LearningCardItem, extra: Record<string, string> = {}): string {
  const context = { ...templateContext(item), ...extra };

  return template.replace(/\{([^}]+)\}/g, (_, key: string) => context[key] ?? "");
}

function getSkillOrThrow(skillId: string): SkillDefinition {
  const skill = getSkillDefinition(skillId);

  if (!skill) {
    throw new Error(`Unknown skill "${skillId}" while building learning content.`);
  }

  return skill;
}

function genericFallbackLines(item: LearningCardItem): string[] {
  return Object.entries(item.attributes)
    .slice(0, 4)
    .map(([key, value]) => `${item.name} has ${key.replace(/([A-Z])/g, " $1").toLowerCase()} ${value}.`);
}

export function buildDescription(item: LearningCardItem): string {
  const skill = getSkillOrThrow(item.skillId);
  return item.description ?? renderTemplate(skill.lesson.descriptionTemplate, item);
}

export function buildFunFacts(item: LearningCardItem): string[] {
  const skill = getSkillOrThrow(item.skillId);

  return uniqueLines([
    ...(item.funFacts ?? []),
    ...skill.lesson.funFactTemplates.map((template) => renderTemplate(template, item)),
  ]).slice(0, 4);
}

export function buildLearningFacts(item: LearningCardItem): string[] {
  const skill = getSkillOrThrow(item.skillId);
  const description = buildDescription(item);
  const renderedTemplates = skill.lesson.learningFactTemplates.map((template) =>
    renderTemplate(template, item),
  );

  const lines = uniqueLines([
    description,
    ...renderedTemplates,
    ...item.facts,
    ...buildFunFacts(item),
    ...genericFallbackLines(item),
  ]);

  return lines.slice(0, 10);
}

export function buildCluePool(item: LearningCardItem): string[] {
  const skill = getSkillOrThrow(item.skillId);

  return uniqueLines([
    ...(item.clues ?? []),
    ...skill.lesson.clueTemplates.map((template) => renderTemplate(template, item)),
  ]);
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
  const skill = getSkillOrThrow(item.skillId);

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
  const skill = getSkillOrThrow(item.skillId);
  return item.badge ?? (skill.badgeFieldKey ? item.attributes[skill.badgeFieldKey] : "") ?? "";
}

export function renderPromptTemplate(
  template: string,
  item: LearningCardItem,
  extra: Record<string, string> = {},
): string {
  return renderTemplate(template, item, extra);
}
