import { Suspense } from "react";

import { LearnRoute } from "@/components/learn-route";

export const dynamic = "force-static";

export default function LearnPage() {
  return (
    <Suspense fallback={null}>
      <LearnRoute />
    </Suspense>
  );
}
