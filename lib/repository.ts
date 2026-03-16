import { z } from "zod";

import { generatedSkillPacks } from "@/lib/generated-skill-packs";
import { getSkillDefinition, listSkillDefinitions } from "@/lib/skill-catalog";
import { LearningCardItem, SkillContentPack, SkillDefinition, SkillId } from "@/lib/types";

const mapSchema = z.object({
  kind: z.enum(["country", "continent"]),
  featureId: z.string().min(1).optional(),
  featureIds: z.array(z.string().min(1)).min(1).optional(),
  geometryId: z.string().min(1).optional(),
  iso2: z.string().min(1).optional(),
  iso3: z.string().min(1).optional(),
  wikidataId: z.string().min(1).optional(),
  bounds: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  centroid: z.tuple([z.number(), z.number()]).optional(),
  worldview: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  subregion: z.string().min(1).optional(),
});

const itemSchema = z.object({
  id: z.string().min(1),
  skillId: z.string().min(1),
  name: z.string().min(1),
  badge: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  attributes: z.record(z.string(), z.string()),
  map: mapSchema.optional(),
  facts: z.array(z.string().min(1)).min(2),
  funFacts: z.array(z.string().min(1)).optional(),
  clues: z.array(z.string().min(1)).min(10),
  tags: z.array(z.string().min(1)).optional(),
});

const packSchema = z.object({
  skillId: z.string().min(1),
  version: z.number().int().positive(),
  items: z.array(itemSchema).min(1),
});

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeLine(line: string): string {
  return line.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeLetters(value: string): string {
  return normalizeLine(value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")).replace(/[^a-z]/g, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateSkillDefinitions(definitions: SkillDefinition[]) {
  const ids = new Set<string>();

  definitions.forEach((definition) => {
    assert(!ids.has(definition.id), `Duplicate skill id "${definition.id}" found in skill catalog.`);
    assert(definition.supportedModes.length > 0, `Skill ${definition.id} has no supported modes.`);
    assert(definition.fields.length > 0, `Skill ${definition.id} has no field definitions.`);
    assert(
      definition.questionTemplates.length > 0,
      `Skill ${definition.id} has no question templates.`,
    );
    ids.add(definition.id);
  });
}

function validatePack(skill: SkillDefinition, pack: SkillContentPack) {
  assert(pack.skillId === skill.id, `Content pack ${pack.skillId} does not match skill ${skill.id}.`);

  const itemIds = new Set<string>();
  const requiredFieldKeys = new Set(
    [...skill.fields.map((field) => field.key), ...skill.detailFieldKeys, skill.badgeFieldKey].filter(Boolean) as string[],
  );

  pack.items.forEach((item) => {
    assert(item.skillId === skill.id, `Item ${item.id} does not match skill ${skill.id}.`);
    assert(!itemIds.has(item.id), `Duplicate id ${item.id} found in ${skill.id}.`);
    assert(item.facts.length >= 2, `Item ${item.id} in ${skill.id} must include at least 2 facts.`);
    assert((item.clues?.length ?? 0) >= 10, `Item ${item.id} in ${skill.id} must include at least 10 clues.`);

    const normalizedClues = item.clues.map(normalizeLine);
    assert(
      new Set(normalizedClues).size === normalizedClues.length,
      `Item ${item.id} in ${skill.id} contains duplicate clues after normalization.`,
    );

    const answerMatcher = new RegExp(`\\b${escapeRegExp(item.name.toLowerCase())}\\b`, "i");
    const answerLetters = normalizeLetters(item.name);
    item.clues.forEach((clue) => {
      assert(
        !answerMatcher.test(clue) && !normalizeLetters(clue).includes(answerLetters),
        `Item ${item.id} in ${skill.id} has a clue that contains the answer name.`,
      );
    });

    const bannedTemplatePhrases = [
      "this answer is",
      "geography lessons place it",
      "students often remember it",
      "map lessons group it",
      "the landlocked clue for it is",
      "the city clue",
      "the country clue",
    ];

    item.clues.forEach((clue) => {
      const normalizedClue = normalizeLine(clue);
      assert(
        !bannedTemplatePhrases.some((phrase) => normalizedClue.includes(phrase)),
        `Item ${item.id} in ${skill.id} contains low-quality boilerplate clue text.`,
      );
    });

    const normalizedFactLines = new Set([
      ...item.facts.map(normalizeLine),
      ...(item.funFacts ?? []).map(normalizeLine),
    ]);

    item.clues.forEach((clue) => {
      assert(
        !normalizedFactLines.has(normalizeLine(clue)),
        `Item ${item.id} in ${skill.id} has a clue duplicated from facts or fun facts.`,
      );
    });

    requiredFieldKeys.forEach((fieldKey) => {
      assert(
        item.attributes[fieldKey] !== undefined && item.attributes[fieldKey] !== "",
        `Item ${item.id} in ${skill.id} is missing required field "${fieldKey}".`,
      );
    });

    if (skill.supportedModes.includes("map-quiz")) {
      assert(item.map !== undefined, `Item ${item.id} in ${skill.id} is missing map metadata.`);
      assert(
        Boolean(item.map.featureId) || (item.map.featureIds?.length ?? 0) > 0,
        `Item ${item.id} in ${skill.id} needs at least one map feature reference.`,
      );
      assert(
        item.map.bounds !== undefined && item.map.centroid !== undefined,
        `Item ${item.id} in ${skill.id} is missing map bounds or centroid data.`,
      );
    }

    itemIds.add(item.id);
  });
}

const skillDefinitions = listSkillDefinitions();
validateSkillDefinitions(skillDefinitions);

const contentBySkill = new Map<SkillId, LearningCardItem[]>();

skillDefinitions.forEach((skill) => {
  const sourcePack = generatedSkillPacks[skill.contentFile];

  assert(
    sourcePack !== undefined,
    `No generated content pack was found for "${skill.contentFile}". Run npm run build:data.`,
  );

  const parsedPack = packSchema.parse(sourcePack as SkillContentPack);
  validatePack(skill, parsedPack);
  contentBySkill.set(skill.id, parsedPack.items);
});

export const skillRepository = {
  listSkills(): SkillDefinition[] {
    return skillDefinitions;
  },

  getSkill(skillId: SkillId): SkillDefinition | undefined {
    return getSkillDefinition(skillId);
  },

  getItems(skillId: SkillId): LearningCardItem[] {
    return contentBySkill.get(skillId) ?? [];
  },

  getItemsForSkills(skillIds: SkillId[]): LearningCardItem[] {
    return skillIds.flatMap((skillId) => contentBySkill.get(skillId) ?? []);
  },
};
