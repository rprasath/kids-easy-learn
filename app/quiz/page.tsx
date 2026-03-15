import { Suspense } from "react";

import { QuizRoute } from "@/components/quiz-route";

export const dynamic = "force-static";

export default function QuizPage() {
  return (
    <Suspense fallback={null}>
      <QuizRoute />
    </Suspense>
  );
}
