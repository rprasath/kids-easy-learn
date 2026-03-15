import {
  getItemBadge,
  pickQuizClue,
  renderPromptTemplate,
} from "@/lib/learning-content";
import { shuffleBySeed } from "@/lib/random";
import { getSkillDefinition } from "@/lib/skill-catalog";
import { LearningCardItem, QuizQuestion, QuizTemplate, SkillId } from "@/lib/types";

type OptionSource = { id: string; label: string };

function pickOptions(correct: OptionSource, pool: OptionSource[], seed: string): OptionSource[] {
  const uniquePool = Array.from(
    new Map(
      pool
        .filter((item) => item.label !== correct.label)
        .map((item) => [item.label, item]),
    ).values(),
  );
  const distractors = shuffleBySeed(uniquePool, `${seed}:distractors`, (item) => item.label).slice(0, 3);
  return shuffleBySeed([correct, ...distractors], `${seed}:options`, (item) => item.label);
}

function buildFieldValueQuestion(
  item: LearningCardItem,
  siblings: LearningCardItem[],
  template: Extract<QuizTemplate, { kind: "field-value" }>,
  seed: string,
): QuizQuestion | null {
  const correctLabel = item.attributes[template.correctFieldKey];

  if (!correctLabel) {
    return null;
  }

  const optionPool =
    template.optionValues?.map((value) => ({ id: value, label: value })) ??
    siblings
      .map((sibling) => sibling.attributes[template.optionFieldKey ?? template.correctFieldKey])
      .filter(Boolean)
      .map((value) => ({ id: value, label: value }));

  const options = pickOptions({ id: correctLabel, label: correctLabel }, optionPool, seed);

  if (options.length < 4) {
    return null;
  }

  return {
    id: `${item.id}-${template.id}`,
    skillId: item.skillId,
    itemId: item.id,
    prompt: renderPromptTemplate(template.prompt, item),
    promptHint: template.promptHint,
    templateId: template.id,
    options,
    correctOptionId: correctLabel,
  };
}

function buildIdentifyQuestion(
  item: LearningCardItem,
  siblings: LearningCardItem[],
  template: Extract<QuizTemplate, { kind: "identify-item" }>,
  seed: string,
): QuizQuestion | null {
  const clue = pickQuizClue(item, `${seed}:clue`);

  if (!clue) {
    return null;
  }

  return {
    id: `${item.id}-${template.id}`,
    skillId: item.skillId,
    itemId: item.id,
    prompt: renderPromptTemplate(template.prompt, item, { clue }),
    promptHint: template.promptHint,
    templateId: template.id,
    options: pickOptions(
      { id: item.id, label: item.name },
      siblings.map((sibling) => ({ id: sibling.id, label: sibling.name })),
      `${seed}:identify`,
    ),
    correctOptionId: item.id,
  };
}

function buildQuestionsForItem(item: LearningCardItem, siblings: LearningCardItem[], seed: string): QuizQuestion[] {
  const skill = getSkillDefinition(item.skillId);

  if (!skill) {
    return [];
  }

  return skill.questionTemplates
    .map((template) =>
      template.kind === "field-value"
        ? buildFieldValueQuestion(item, siblings, template, `${seed}:${item.id}:${template.id}`)
        : buildIdentifyQuestion(item, siblings, template, `${seed}:${item.id}:${template.id}`),
    )
    .filter((question): question is QuizQuestion => question !== null);
}

function toQuestionBank(items: LearningCardItem[], seed: string): QuizQuestion[] {
  const itemsBySkill = new Map<SkillId, LearningCardItem[]>();

  items.forEach((item) => {
    const current = itemsBySkill.get(item.skillId) ?? [];
    current.push(item);
    itemsBySkill.set(item.skillId, current);
  });

  return items.flatMap((item) =>
    buildQuestionsForItem(item, itemsBySkill.get(item.skillId) ?? [], seed),
  );
}

export function buildQuizQuestions(items: LearningCardItem[], count: number, seed = "quiz-session"): QuizQuestion[] {
  const bank = shuffleBySeed(toQuestionBank(items, seed), `${seed}:bank`, (question) => question.id);
  const seenItems = new Set<string>();
  const questions: QuizQuestion[] = [];

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

export function skillLabel(skillId: SkillId): string {
  return getSkillDefinition(skillId)?.sessionLabel ?? skillId;
}

export function skillTitle(skillId: SkillId): string {
  return getSkillDefinition(skillId)?.title ?? skillId;
}

export function itemBadge(item: LearningCardItem): string {
  return getItemBadge(item) || item.name.slice(0, 2).toUpperCase();
}
