import { Suspense } from "react";

import { ResultsRoute } from "@/components/results-route";

export const dynamic = "force-static";

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsRoute />
    </Suspense>
  );
}
