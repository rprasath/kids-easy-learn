import { describe, expect, it } from "vitest";

import { buildQuizQuestions } from "@/lib/quiz";
import { skillRepository } from "@/lib/repository";

describe("quiz builder", () => {
  it("creates unique questions for mixed-skill sessions", () => {
    const items = skillRepository.getItemsForSkills(["states", "countries"]);
    const questions = buildQuizQuestions(items, 10);

    expect(questions).toHaveLength(10);
    expect(new Set(questions.map((question) => `${question.skillId}:${question.itemId}`)).size).toBe(10);

    questions.forEach((question) => {
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options.map((option) => option.label)).size).toBeGreaterThanOrEqual(3);
    });
  });
});
