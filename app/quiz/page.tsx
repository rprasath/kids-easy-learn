import { FocusShell } from "@/components/focus-shell";
import { QuizSession } from "@/components/quiz-session";
import { skillRepository } from "@/lib/repository";
import { buildSessionConfig } from "@/lib/session";

type QuizPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const resolvedSearchParams = await searchParams;
  const session = buildSessionConfig(resolvedSearchParams, "quiz");
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
