import type { SkillContentPack } from "@/lib/types";

import contentPack1 from "@/data/skills/states/states.json";
import contentPack2 from "@/data/skills/continents/continents.json";
import contentPack3 from "@/data/skills/countries/countries.json";

export const generatedSkillPacks: Record<string, SkillContentPack> = {
  "states/states.json": contentPack1,
  "continents/continents.json": contentPack2,
  "countries/countries.json": contentPack3,
};
