import { AppShell } from "@/components/app-shell";
import { ResultsPanel } from "@/components/results-panel";
import { getDefaultSkillId } from "@/lib/skill-catalog";
import { parsePositiveInt, parseSkillIds } from "@/lib/session";

type ResultsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedSkillIds = parseSkillIds(resolvedSearchParams.skills);
  const mode = Array.isArray(resolvedSearchParams.mode)
    ? resolvedSearchParams.mode[0]
    : resolvedSearchParams.mode ?? "quiz";
  const score = Number.parseInt(
    Array.isArray(resolvedSearchParams.score) ? resolvedSearchParams.score[0] : resolvedSearchParams.score ?? "0",
    10,
  );
  const total = parsePositiveInt(resolvedSearchParams.total ?? resolvedSearchParams.count, 0);
  const viewed = parsePositiveInt(resolvedSearchParams.viewed, 0);
  const favorites = parsePositiveInt(resolvedSearchParams.favorites, 0);

  return (
    <AppShell>
      <ResultsPanel
        favorites={favorites}
        mode={mode === "flashcards" ? "flashcards" : "quiz"}
        score={Number.isNaN(score) ? 0 : score}
        total={total}
        selectedSkillIds={selectedSkillIds.length > 0 ? selectedSkillIds : [getDefaultSkillId()]}
        viewed={viewed}
      />
    </AppShell>
  );
}
