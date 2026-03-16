"use client";

import { useSearchParams } from "next/navigation";

import { FocusShell } from "@/components/focus-shell";
import { MapQuizSession } from "@/components/map-quiz-session";
import { filterMapQuizSkillIds } from "@/lib/map-skills";
import { skillRepository } from "@/lib/repository";
import { buildSessionConfig } from "@/lib/session";

export function MapQuizRoute() {
  const searchParams = useSearchParams();
  const session = buildSessionConfig(
    {
      skills: searchParams.get("skills") ?? undefined,
      seconds: searchParams.get("seconds") ?? undefined,
      count: searchParams.get("count") ?? undefined,
    },
    "map-quiz",
  );
  const selectedSkillIds = filterMapQuizSkillIds(session.selectedSkillIds);
  const items = skillRepository.getItemsForSkills(selectedSkillIds);

  return (
    <FocusShell mode="map-quiz">
      <MapQuizSession
        items={items}
        questionCount={session.questionCount}
        selectedSkillIds={selectedSkillIds}
        stepSeconds={session.stepSeconds}
      />
    </FocusShell>
  );
}
