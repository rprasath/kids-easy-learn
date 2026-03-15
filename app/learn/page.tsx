import { FlashcardSession } from "@/components/flashcard-session";
import { FocusShell } from "@/components/focus-shell";
import { skillRepository } from "@/lib/repository";
import { buildSessionConfig } from "@/lib/session";

type LearnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const resolvedSearchParams = await searchParams;
  const session = buildSessionConfig(resolvedSearchParams, "flashcards");
  const items = skillRepository.getItemsForSkills(session.selectedSkillIds);

  return (
    <FocusShell mode="flashcards">
      <FlashcardSession
        items={items}
        selectedSkillIds={session.selectedSkillIds}
        stepSeconds={session.stepSeconds}
      />
    </FocusShell>
  );
}
