import { describe, expect, it } from "vitest";

import {
  buildCluePool,
  buildDescription,
  buildLearningFacts,
  pickStudyClues,
} from "@/lib/learning-content";
import { skillRepository } from "@/lib/repository";

describe("learning content helpers", () => {
  it("uses stored content for state learning facts", () => {
    const item = skillRepository.getItems("states")[0];

    expect(buildDescription(item)).toMatch(/state/i);
    expect(buildLearningFacts(item)).toEqual(item.facts);
  });

  it("uses stored content for country learning facts", () => {
    const item = skillRepository.getItems("countries")[0];
    expect(buildLearningFacts(item)).toEqual(item.facts);
  });

  it("builds clue pools from authored clue-only lines", () => {
    const item = skillRepository.getItems("states")[0];
    const cluePool = buildCluePool(item);

    expect(cluePool.length).toBeGreaterThanOrEqual(10);
    expect(cluePool).toEqual(expect.arrayContaining(item.clues));
    expect(cluePool).not.toContain(item.facts[0]);
  });

  it("shows three study clues by default", () => {
    const item = skillRepository.getItems("continents")[0];

    expect(pickStudyClues(item)).toHaveLength(3);
  });

  it("can rotate study clues with different seeds", () => {
    const item = skillRepository.getItems("countries")[0];
    const firstSet = pickStudyClues(item, 3, "seed-a");
    const secondSet = pickStudyClues(item, 3, "seed-b");

    expect(firstSet).toHaveLength(3);
    expect(secondSet).toHaveLength(3);
    expect(firstSet.join("|")).not.toBe(secondSet.join("|"));
  });

  it("can reveal more than the default clue preview from the same seed", () => {
    const item = skillRepository.getItems("countries")[0];

    expect(pickStudyClues(item, 6, "seed-a")).toHaveLength(6);
    expect(pickStudyClues(item, 6, "seed-a").slice(0, 3)).toEqual(pickStudyClues(item, 3, "seed-a"));
  });
});
