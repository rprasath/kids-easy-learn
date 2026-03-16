"use client";

import { FocusShell } from "@/components/focus-shell";
import { MapLearnSession } from "@/components/map-learn-session";
import { skillRepository } from "@/lib/repository";

export function MapLearnRoute() {
  const items = skillRepository.getItems("countries");

  return (
    <FocusShell mode="map-learn">
      <MapLearnSession items={items} />
    </FocusShell>
  );
}
