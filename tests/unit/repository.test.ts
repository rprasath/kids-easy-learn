import { describe, expect, it } from "vitest";

import { skillRepository } from "@/lib/repository";

function normalizeLetters(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

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

  it("keeps clues free from answer leaks and template boilerplate", () => {
    const bannedPhrases = [
      "this answer is",
      "geography lessons place it",
      "students often remember it",
      "map lessons group it",
      "the landlocked clue for it is",
      "the city clue",
      "the country clue",
    ];

    skillRepository.listSkills().forEach((skill) => {
      skillRepository.getItems(skill.id).forEach((item) => {
        item.clues.forEach((clue) => {
          expect(normalizeLetters(clue)).not.toContain(normalizeLetters(item.name));
          expect(
            bannedPhrases.some((phrase) => clue.toLowerCase().includes(phrase)),
            `${skill.id}:${item.id} has low-quality clue text: ${clue}`,
          ).toBe(false);
        });
      });
    });
  });
});
