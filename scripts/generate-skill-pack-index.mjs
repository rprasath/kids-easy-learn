import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const skillsFile = path.join(rootDir, "data", "skills", "skills.json");
const outputFile = path.join(rootDir, "lib", "generated-skill-packs.ts");

const skills = JSON.parse(readFileSync(skillsFile, "utf8"));

const imports = [];
const entries = [];

skills.forEach((skill, index) => {
  if (!skill.contentFile) {
    return;
  }

  const importName = `contentPack${index + 1}`;
  const importPath = `@/data/skills/${skill.contentFile}`;

  imports.push(`import ${importName} from "${importPath}";`);
  entries.push(`  "${skill.contentFile}": ${importName},`);
});

const fileContents = `import type { SkillContentPack } from "@/lib/types";

${imports.join("\n")}

export const generatedSkillPacks: Record<string, SkillContentPack> = {
${entries.join("\n")}
};
`;

writeFileSync(outputFile, fileContents);
