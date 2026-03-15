"use client";

import { useSearchParams } from "next/navigation";

import { FocusShell } from "@/components/focus-shell";
import { QuizSession } from "@/components/quiz-session";
import { skillRepository } from "@/lib/repository";
import { buildSessionConfig } from "@/lib/session";

export function QuizRoute() {
  const searchParams = useSearchParams();
  const session = buildSessionConfig(
    {
      skills: searchParams.get("skills") ?? undefined,
      seconds: searchParams.get("seconds") ?? undefined,
      count: searchParams.get("count") ?? undefined,
    },
    "quiz",
  );
  const items = skillRepository.getItemsForSkills(session.selectedSkillIds);

  return (
    <FocusShell mode="quiz">
      <QuizSession
        items={items}
        questionCount={session.questionCount}
        selectedSkillIds={session.selectedSkillIds}
        stepSeconds={session.stepSeconds}
      />
    </FocusShell>
  );
}
