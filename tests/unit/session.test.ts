import { describe, expect, it } from "vitest";

import { buildSessionConfig, parseQuestionCount, parseSkillIds } from "@/lib/session";

describe("session helpers", () => {
  it("deduplicates and filters skills", () => {
    expect(parseSkillIds("states,continents,states,unknown")).toEqual(["states", "continents"]);
  });

  it("clamps question counts", () => {
    expect(parseQuestionCount("2")).toBe(5);
    expect(parseQuestionCount("14")).toBe(14);
    expect(parseQuestionCount("42")).toBe(20);
  });

  it("builds a default session when no valid skills are provided", () => {
    expect(buildSessionConfig({}, "quiz")).toEqual({
      selectedSkillIds: ["states"],
      mode: "quiz",
      questionCount: 10,
      stepSeconds: 20,
      shuffle: true,
    });
  });
});
