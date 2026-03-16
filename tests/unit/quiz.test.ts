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

  it("uses authored clues for identify-item questions", () => {
    const items = skillRepository.getItemsForSkills(["countries"]);
    const questions = buildQuizQuestions(items, 20, "identify-check");
    const identifyQuestion = questions.find((question) => question.templateId === "identify");

    expect(identifyQuestion).toBeDefined();

    const sourceItem = items.find((item) => item.id === identifyQuestion?.itemId);
    expect(sourceItem).toBeDefined();
    expect(sourceItem?.clues.some((clue) => identifyQuestion?.prompt.includes(clue))).toBe(true);
    expect(sourceItem?.facts.some((fact) => identifyQuestion?.prompt.includes(fact))).toBe(false);
  });

  it("prefers geographically related distractors for country questions", () => {
    const items = skillRepository.getItems("countries");
    const questions = buildQuizQuestions(items, 60, "related-country-options");
    const capitalQuestion = questions.find(
      (question) => question.skillId === "countries" && question.templateId === "capital",
    );

    expect(capitalQuestion).toBeDefined();

    const sourceItem = items.find((item) => item.id === capitalQuestion?.itemId);
    expect(sourceItem).toBeDefined();

    const distractorCountries = capitalQuestion!.options
      .filter((option) => option.id !== capitalQuestion!.correctOptionId)
      .map((option) => items.find((item) => item.attributes.capital === option.label))
      .filter((item): item is (typeof items)[number] => item !== undefined);

    expect(
      distractorCountries.some(
        (item) => item.attributes.continent === sourceItem!.attributes.continent,
      ),
    ).toBe(true);
  });
});
