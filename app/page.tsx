import { AppShell } from "@/components/app-shell";
import { SessionBuilder } from "@/components/session-builder";
import { skillRepository } from "@/lib/repository";

export default function HomePage() {
  const skills = skillRepository.listSkills();
  const itemCounts = Object.fromEntries(
    skills.map((skill) => [skill.id, skillRepository.getItems(skill.id).length]),
  );

  return (
    <AppShell>
      <SessionBuilder itemCounts={itemCounts} skills={skills} />
    </AppShell>
  );
}
