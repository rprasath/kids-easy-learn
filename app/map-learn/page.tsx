import { Suspense } from "react";

import { MapLearnRoute } from "@/components/map-learn-route";

export const dynamic = "force-static";

export default function MapLearnPage() {
  return (
    <Suspense fallback={null}>
      <MapLearnRoute />
    </Suspense>
  );
}
