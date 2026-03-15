import { describe, expect, it } from "vitest";

import {
  buildCluePool,
  buildDescription,
  buildFunFacts,
  buildLearningFacts,
  pickStudyClues,
} from "@/lib/learning-content";
import { skillRepository } from "@/lib/repository";

describe("learning content helpers", () => {
  it("builds at least 10 learning facts for a state item", () => {
    const item = skillRepository.getItems("states")[0];

    expect(buildDescription(item)).toMatch(/state/i);
    expect(buildFunFacts(item).length).toBeGreaterThan(0);
    expect(buildLearningFacts(item)).toHaveLength(10);
  });

  it("builds at least 10 learning facts for a country item", () => {
    const item = skillRepository.getItems("countries")[0];
    expect(buildLearningFacts(item)).toHaveLength(10);
  });

  it("builds clue pools from clue-only lines", () => {
    const item = skillRepository.getItems("states")[0];
    const cluePool = buildCluePool(item);

    expect(cluePool.length).toBeGreaterThanOrEqual(15);
    expect(cluePool).toEqual(expect.arrayContaining(item.clues ?? []));
    expect(cluePool).not.toContain(item.facts[0]);
  });

  it("can rotate study clues with different seeds", () => {
    const item = skillRepository.getItems("countries")[0];
    const firstSet = pickStudyClues(item, 3, "seed-a");
    const secondSet = pickStudyClues(item, 3, "seed-b");

    expect(firstSet).toHaveLength(3);
    expect(secondSet).toHaveLength(3);
    expect(firstSet.join("|")).not.toBe(secondSet.join("|"));
  });
});
