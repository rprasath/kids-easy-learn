import { describe, expect, it } from "vitest";

import { skillRepository } from "@/lib/repository";

describe("skill repository", () => {
  it("returns active skills", () => {
    expect(skillRepository.listSkills().map((skill) => skill.id)).toEqual([
      "states",
      "continents",
      "countries",
    ]);
  });

  it("aggregates items across multiple skills", () => {
    const items = skillRepository.getItemsForSkills(["states", "continents"]);
    expect(items.some((item) => item.skillId === "states")).toBe(true);
    expect(items.some((item) => item.skillId === "continents")).toBe(true);
    expect(items.some((item) => item.skillId === "countries")).toBe(false);
  });

  it("keeps the full countries pack and authored clue minimums", () => {
    const countries = skillRepository.getItems("countries");

    expect(countries.length).toBeGreaterThanOrEqual(195);
    countries.forEach((item) => {
      expect(item.clues.length).toBeGreaterThanOrEqual(10);
    });
  });
});
