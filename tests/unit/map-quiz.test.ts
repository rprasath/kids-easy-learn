import { describe, expect, it } from "vitest";

import { buildMapQuizQuestions } from "@/lib/map-quiz";
import { skillRepository } from "@/lib/repository";

describe("map quiz builder", () => {
  it("creates map quiz questions for countries with hints and 4 options", () => {
    const items = skillRepository.getItems("countries");
    const questions = buildMapQuizQuestions(items, 12, "country-map-quiz");

    expect(questions).toHaveLength(12);
    questions.forEach((question) => {
      expect(question.options).toHaveLength(4);
      expect(question.map.kind).toBe("country");
      expect(question.hint.toLowerCase()).toContain("hint:");
      expect(question.revealFacts.length).toBeGreaterThan(0);
    });
  });

  it("creates continent map quiz questions with grouped geometry refs", () => {
    const items = skillRepository.getItems("continents");
    const questions = buildMapQuizQuestions(items, 7, "continent-map-quiz");

    expect(questions).toHaveLength(7);
    questions.forEach((question) => {
      expect(question.map.kind).toBe("continent");
      expect(question.map.featureIds?.length).toBeGreaterThan(0);
    });
  });
});
