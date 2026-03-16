import { describe, expect, it } from "vitest";

import { buildSessionConfig, parseAutoMode, parseQuestionCount, parseSkillIds } from "@/lib/session";

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
      stepSeconds: 60,
      autoMode: true,
      shuffle: true,
    });
  });

  it("supports map quiz mode with the same session defaults", () => {
    expect(buildSessionConfig({}, "map-quiz")).toEqual({
      selectedSkillIds: ["states"],
      mode: "map-quiz",
      questionCount: 10,
      stepSeconds: 60,
      autoMode: false,
      shuffle: true,
    });
  });

  it("parses auto mode safely", () => {
    expect(parseAutoMode("0", true)).toBe(false);
    expect(parseAutoMode("true", false)).toBe(true);
    expect(parseAutoMode(undefined, true)).toBe(true);
  });
});
