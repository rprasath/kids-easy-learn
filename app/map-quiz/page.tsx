import { Suspense } from "react";

import { MapQuizRoute } from "@/components/map-quiz-route";

export const dynamic = "force-static";

export default function MapQuizPage() {
  return (
    <Suspense fallback={null}>
      <MapQuizRoute />
    </Suspense>
  );
}
