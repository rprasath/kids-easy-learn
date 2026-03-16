"use client";

import { useEffect, useMemo, useState } from "react";

import { GeographyMap } from "@/components/geography-map";
import { MapItemDetailsDialog } from "@/components/map-item-details-dialog";
import { filterCountriesByQuery, findCountryByFeatureId } from "@/lib/map-learn";
import { LearningCardItem } from "@/lib/types";

type MapLearnSessionProps = {
  items: LearningCardItem[];
};

export function MapLearnSession({ items }: MapLearnSessionProps) {
  const [query, setQuery] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState(items[0]?.id ?? "");
  const [detailsItemId, setDetailsItemId] = useState<string | null>(null);

  const filteredItems = useMemo(() => filterCountriesByQuery(items, query), [items, query]);
  const selectedItem =
    items.find((item) => item.id === selectedCountryId) ??
    filteredItems[0] ??
    items[0] ??
    null;
  const detailsItem = items.find((item) => item.id === detailsItemId) ?? null;

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    setSelectedCountryId(selectedItem.id);
  }, [selectedItem]);

  function openCountry(item: LearningCardItem) {
    setSelectedCountryId(item.id);
    setDetailsItemId(item.id);
  }

  function selectFromFeature(featureId: string) {
    const item = findCountryByFeatureId(items, featureId);

    if (!item) {
      return;
    }

    openCountry(item);
  }

  if (!selectedItem) {
    return (
      <section className="rounded-[2rem] bg-white p-8 paper-shadow">
        <p className="text-lg font-semibold text-slate-700">
          We could not load the interactive world map right now.
        </p>
      </section>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] bg-white/70 px-4 py-3 paper-shadow backdrop-blur">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Visual Map Learn
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900">Click any country to explore it</div>
        </div>
        <div className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
          Countries only for now
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
        <GeographyMap
          item={selectedItem}
          interactive
          mapLabel="Interactive world countries map"
          onSelectFeatureId={selectFromFeature}
          title={selectedItem.name}
          caption="Drag, zoom, or click any country on the world map to open its details."
        />

        <section className="rounded-[2rem] bg-white/90 p-6 paper-shadow backdrop-blur">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">
            Search Countries
          </div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Find a country fast</h2>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Type a country, capital, region, or country code, then open the details from the list.
          </p>

          <label className="mt-5 block">
            <span className="sr-only">Search countries</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for Japan, Nairobi, Europe, BR..."
              className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-0 placeholder:text-slate-400"
            />
          </label>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {filteredItems.length} match{filteredItems.length === 1 ? "" : "es"}
            </div>
            <button
              type="button"
              onClick={() => openCountry(selectedItem)}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
            >
              View {selectedItem.name}
            </button>
          </div>

          <div className="mt-4 max-h-[28rem] overflow-y-auto rounded-[1.4rem] border border-slate-200 bg-slate-50 p-2">
            <div className="grid gap-2">
              {filteredItems.slice(0, 80).map((item) => {
                const isSelected = item.id === selectedItem.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openCountry(item)}
                    className={`rounded-[1.1rem] px-4 py-3 text-left transition ${
                      isSelected
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-sky-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-black">{item.name}</div>
                        <div className={`mt-1 text-xs font-semibold ${isSelected ? "text-slate-200" : "text-slate-500"}`}>
                          {item.attributes.capital} · {item.attributes.continent}
                        </div>
                      </div>
                      <div className="text-xl">{item.badge ?? ""}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {detailsItem ? (
        <MapItemDetailsDialog
          item={detailsItem}
          onClose={() => setDetailsItemId(null)}
          actionLabel="Close"
          eyebrow="Country Details"
          headline={`Explore ${detailsItem.name}`}
          tone="neutral"
        />
      ) : null}
    </div>
  );
}
