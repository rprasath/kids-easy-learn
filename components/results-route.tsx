"use client";

import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ResultsPanel } from "@/components/results-panel";
import { getDefaultSkillId } from "@/lib/skill-catalog";
import { parsePositiveInt, parseSkillIds } from "@/lib/session";

export function ResultsRoute() {
  const searchParams = useSearchParams();
  const selectedSkillIds = parseSkillIds(searchParams.get("skills") ?? undefined);
  const mode = searchParams.get("mode") ?? "quiz";
  const score = Number.parseInt(searchParams.get("score") ?? "0", 10);
  const total = parsePositiveInt(searchParams.get("total") ?? searchParams.get("count") ?? undefined, 0);
  const viewed = parsePositiveInt(searchParams.get("viewed") ?? undefined, 0);
  const favorites = parsePositiveInt(searchParams.get("favorites") ?? undefined, 0);

  return (
    <AppShell>
      <ResultsPanel
        favorites={favorites}
        mode={mode === "flashcards" ? "flashcards" : mode === "map-quiz" ? "map-quiz" : "quiz"}
        score={Number.isNaN(score) ? 0 : score}
        total={total}
        selectedSkillIds={selectedSkillIds.length > 0 ? selectedSkillIds : [getDefaultSkillId()]}
        viewed={viewed}
      />
    </AppShell>
  );
}
