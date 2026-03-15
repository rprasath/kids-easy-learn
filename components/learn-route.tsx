"use client";

import { useSearchParams } from "next/navigation";

import { FlashcardSession } from "@/components/flashcard-session";
import { FocusShell } from "@/components/focus-shell";
import { skillRepository } from "@/lib/repository";
import { buildSessionConfig } from "@/lib/session";

export function LearnRoute() {
  const searchParams = useSearchParams();
  const session = buildSessionConfig(
    {
      skills: searchParams.get("skills") ?? undefined,
      seconds: searchParams.get("seconds") ?? undefined,
      count: searchParams.get("count") ?? undefined,
    },
    "flashcards",
  );
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
