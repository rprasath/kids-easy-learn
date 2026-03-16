import { shuffleBySeed } from "@/lib/random";
import { LearningCardItem, MapQuizQuestion, SkillId } from "@/lib/types";

type OptionSource = { id: string; label: string };

function uniqueOptionPool(correct: OptionSource, pool: OptionSource[]): OptionSource[] {
  return Array.from(
    new Map(
      pool
        .filter((item) => item.label !== correct.label)
        .map((item) => [item.label, item]),
    ).values(),
  );
}

function pickOptions(
  correct: OptionSource,
  preferredGroups: OptionSource[][],
  fallbackPool: OptionSource[],
  seed: string,
): OptionSource[] {
  const distractors: OptionSource[] = [];
  const seenLabels = new Set([correct.label]);

  preferredGroups.forEach((group, index) => {
    const options = shuffleBySeed(
      uniqueOptionPool(correct, group).filter((option) => !seenLabels.has(option.label)),
      `${seed}:preferred:${index}`,
      (item) => item.label,
    );

    for (const option of options) {
      if (distractors.length === 3) {
        break;
      }

      distractors.push(option);
      seenLabels.add(option.label);
    }
  });

  const fallbackOptions = shuffleBySeed(
    uniqueOptionPool(correct, fallbackPool).filter((option) => !seenLabels.has(option.label)),
    `${seed}:fallback`,
    (item) => item.label,
  );

  for (const option of fallbackOptions) {
    if (distractors.length === 3) {
      break;
    }

    distractors.push(option);
    seenLabels.add(option.label);
  }

  return shuffleBySeed([correct, ...distractors], `${seed}:options`, (item) => item.label);
}

function relatedSiblingGroups(item: LearningCardItem, siblings: LearningCardItem[]): LearningCardItem[][] {
  const otherItems = siblings.filter((sibling) => sibling.id !== item.id);

  if (item.skillId === "countries") {
    return [
      otherItems.filter((sibling) => sibling.attributes.subregion === item.attributes.subregion),
      otherItems.filter((sibling) => sibling.attributes.continent === item.attributes.continent),
    ];
  }

  if (item.skillId === "continents") {
    return [otherItems.filter((sibling) => sibling.attributes.hemisphere === item.attributes.hemisphere)];
  }

  return [];
}

function buildHint(item: LearningCardItem): string {
  if (item.skillId === "countries") {
    return `Hint: This country is in ${item.attributes.subregion}, part of ${item.attributes.continent}.`;
  }

  return `Hint: This continent is mostly in the ${item.attributes.hemisphere} Hemisphere.`;
}

function buildRevealFacts(item: LearningCardItem): string[] {
  return [...item.facts.slice(0, 2), ...(item.funFacts ?? []).slice(0, 1)].slice(0, 2);
}

function buildQuestion(
  item: LearningCardItem,
  siblings: LearningCardItem[],
  seed: string,
): MapQuizQuestion | null {
  if (!item.map) {
    return null;
  }

  const options = pickOptions(
    { id: item.id, label: item.name },
    relatedSiblingGroups(item, siblings).map((group) =>
      group.map((sibling) => ({ id: sibling.id, label: sibling.name })),
    ),
    siblings.map((sibling) => ({ id: sibling.id, label: sibling.name })),
    `${seed}:${item.id}`,
  );

  if (options.length < 4) {
    return null;
  }

  return {
    id: `${item.id}:map-quiz`,
    skillId: item.skillId,
    itemId: item.id,
    prompt:
      item.skillId === "countries"
        ? "Which country is highlighted on the map?"
        : "Which continent is highlighted on the map?",
    promptHint:
      item.skillId === "countries"
        ? "Use the shape and the region hint to choose the right country."
        : "Use the highlighted landmass and the hemisphere hint to choose the right continent.",
    hint: buildHint(item),
    options,
    correctOptionId: item.id,
    map: item.map,
    revealFacts: buildRevealFacts(item),
  };
}

function toQuestionBank(items: LearningCardItem[], seed: string): MapQuizQuestion[] {
  const itemsBySkill = new Map<SkillId, LearningCardItem[]>();

  items.forEach((item) => {
    if (!item.map) {
      return;
    }

    const current = itemsBySkill.get(item.skillId) ?? [];
    current.push(item);
    itemsBySkill.set(item.skillId, current);
  });

  return items
    .filter((item) => item.map)
    .flatMap((item) => {
      const question = buildQuestion(item, itemsBySkill.get(item.skillId) ?? [], seed);
      return question ? [question] : [];
    });
}

export function buildMapQuizQuestions(
  items: LearningCardItem[],
  count: number,
  seed = "map-quiz-session",
): MapQuizQuestion[] {
  const bank = shuffleBySeed(toQuestionBank(items, seed), `${seed}:bank`, (question) => question.id);
  const questions: MapQuizQuestion[] = [];
  const seenItems = new Set<string>();

  for (const question of bank) {
    const key = `${question.skillId}:${question.itemId}`;
    if (seenItems.has(key)) {
      continue;
    }

    questions.push(question);
    seenItems.add(key);

    if (questions.length === count) {
      break;
    }
  }

  return questions;
}
