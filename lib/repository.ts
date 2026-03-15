import { z } from "zod";

import { generatedSkillPacks } from "@/lib/generated-skill-packs";
import { getSkillDefinition, listSkillDefinitions } from "@/lib/skill-catalog";
import { LearningCardItem, SkillContentPack, SkillDefinition, SkillId } from "@/lib/types";

const itemSchema = z.object({
  id: z.string().min(1),
  skillId: z.string().min(1),
  name: z.string().min(1),
  badge: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  attributes: z.record(z.string(), z.string()),
  facts: z.array(z.string().min(1)).min(2),
  funFacts: z.array(z.string().min(1)).optional(),
  clues: z.array(z.string().min(1)).optional(),
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
    assert((item.funFacts?.length ?? 0) >= 2, `Item ${item.id} in ${skill.id} must include at least 2 fun facts.`);
    assert((item.clues?.length ?? 0) >= 15, `Item ${item.id} in ${skill.id} must include at least 15 clues.`);

    requiredFieldKeys.forEach((fieldKey) => {
      assert(
        item.attributes[fieldKey] !== undefined && item.attributes[fieldKey] !== "",
        `Item ${item.id} in ${skill.id} is missing required field "${fieldKey}".`,
      );
    });

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
