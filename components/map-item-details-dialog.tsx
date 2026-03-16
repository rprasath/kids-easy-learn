"use client";

import { useEffect, useMemo, useState } from "react";

import { buildDescription, buildFunFacts, getDisplayFieldLines, getItemBadge } from "@/lib/learning-content";
import { LearningCardItem } from "@/lib/types";
import { commonsImage, fetchWikidataCountryDetails, WikidataCountryDetails } from "@/lib/wikidata";

type MapItemDetailsDialogProps = {
  item: LearningCardItem;
  onClose: () => void;
  actionLabel?: string;
  eyebrow?: string;
  headline?: string;
  tone?: "neutral" | "success" | "error";
};

export function MapItemDetailsDialog({
  item,
  onClose,
  actionLabel = "Close",
  eyebrow,
  headline,
  tone = "neutral",
}: MapItemDetailsDialogProps) {
  const [wikidataDetails, setWikidataDetails] = useState<WikidataCountryDetails | null>(null);
  const [wikidataStatus, setWikidataStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const displayFields = useMemo(() => getDisplayFieldLines(item).slice(0, 6), [item]);
  const description = useMemo(() => buildDescription(item), [item]);
  const funFacts = useMemo(() => buildFunFacts(item).slice(0, 3), [item]);
  const badge = useMemo(() => getItemBadge(item), [item]);
  const detailFacts = useMemo(() => [...item.facts.slice(0, 3), ...funFacts].slice(0, 4), [funFacts, item.facts]);
  const statusTone =
    tone === "success" ? "text-emerald-700" : tone === "error" ? "text-rose-700" : "text-slate-700";

  useEffect(() => {
    if (item.skillId !== "countries" || !item.map?.wikidataId) {
      setWikidataStatus("idle");
      setWikidataDetails(null);
      return;
    }

    const controller = new AbortController();
    setWikidataStatus("loading");
    setWikidataDetails(null);

    fetchWikidataCountryDetails(item.map.wikidataId, controller.signal)
      .then((details) => {
        if (!details) {
          setWikidataStatus("error");
          return;
        }

        setWikidataDetails(details);
        setWikidataStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setWikidataStatus("error");
        }
      });

    return () => controller.abort();
  }, [item]);

  const hasWikidataDetails = wikidataStatus === "ready" && wikidataDetails;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={item.skillId === "countries" ? "Country details" : "Item details"}
          className="my-auto flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
        >
          <div className="border-b border-slate-200 bg-gradient-to-r from-amber-50 via-white to-emerald-50 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                {headline ? <div className={`text-lg font-black ${statusTone}`}>{headline}</div> : null}
                <div className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  {eyebrow ?? (item.skillId === "countries" ? "Country Details" : "Details")}
                </div>
                <h3 className="mt-1 text-2xl font-black text-slate-900">{item.name}</h3>
                {description ? (
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                    {description}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                {badge ? (
                  <div className="rounded-full bg-white px-4 py-2 text-2xl shadow-sm">{badge}</div>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 overscroll-contain">
            {displayFields.length > 0 ? (
              <div className="grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-2">
                {displayFields.map((field) => (
                  <div key={field.label} className="rounded-[1rem] bg-slate-50 px-3 py-3">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      {field.label}
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{field.value}</div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid gap-4 pt-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Quick Facts
                </div>
                <div className="mt-3 grid gap-2">
                  {item.facts.slice(0, 2).map((fact) => (
                    <div
                      key={fact}
                      className="rounded-[1.1rem] bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      {fact}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Learn More
                </div>
                <div className="mt-3 grid gap-2">
                  {detailFacts.map((fact) => (
                    <div
                      key={fact}
                      className="rounded-[1.1rem] bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                    >
                      {fact}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {item.skillId === "countries" ? (
              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Wikidata Details
                </div>

                {wikidataStatus === "loading" ? (
                  <div className="mt-3 rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                    Loading live details from Wikidata...
                  </div>
                ) : null}

                {wikidataStatus === "error" ? (
                  <div className="mt-3 rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                    Live Wikidata details are unavailable right now, so the popup is showing local learning facts instead.
                  </div>
                ) : null}

                {hasWikidataDetails ? (
                  <div className="mt-4 grid gap-4">
                    {wikidataDetails.pageBanner ? (
                      <img
                        src={commonsImage(wikidataDetails.pageBanner, 1200)}
                        alt={`Banner for ${item.name}`}
                        className="h-44 w-full rounded-[1.2rem] object-cover"
                      />
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
                      <div className="grid gap-3">
                        {wikidataDetails.flagImage ? (
                          <a
                            href={wikidataDetails.flagImage}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-[1.2rem] bg-slate-50 p-3 text-center ring-1 ring-slate-200"
                          >
                            <img
                              src={commonsImage(wikidataDetails.flagImage, 240)}
                              alt={`Flag of ${item.name}`}
                              className="mx-auto max-h-28 rounded border border-slate-200"
                            />
                          </a>
                        ) : null}

                        {wikidataDetails.coatOfArms ? (
                          <a
                            href={wikidataDetails.coatOfArms}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-[1.2rem] bg-slate-50 p-3 text-center ring-1 ring-slate-200"
                          >
                            <img
                              src={commonsImage(wikidataDetails.coatOfArms, 220)}
                              alt={`Coat of arms of ${item.name}`}
                              className="mx-auto max-h-32"
                            />
                            <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                              Coat of Arms
                            </div>
                          </a>
                        ) : null}
                      </div>

                      <div className="grid gap-3">
                        {wikidataDetails.capital ? (
                          <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                              Capital
                            </div>
                            <div className="mt-1 text-sm font-bold text-slate-900">{wikidataDetails.capital}</div>
                          </div>
                        ) : null}

                        {wikidataDetails.officialLanguages.length > 0 ? (
                          <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                              Official Languages
                            </div>
                            <div className="mt-1 text-sm font-bold text-slate-900">
                              {wikidataDetails.officialLanguages.join(", ")}
                            </div>
                          </div>
                        ) : null}

                        {wikidataDetails.spokenLanguages.length > 0 ? (
                          <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                              Other Languages
                            </div>
                            <div className="mt-1 text-sm font-bold text-slate-900">
                              {wikidataDetails.spokenLanguages.join(", ")}
                            </div>
                          </div>
                        ) : null}

                        {wikidataDetails.namedAfter.length > 0 ? (
                          <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                              Named After
                            </div>
                            <div className="mt-1 text-sm font-bold text-slate-900">
                              {wikidataDetails.namedAfter.join(", ")}
                            </div>
                          </div>
                        ) : null}

                        {wikidataDetails.website ? (
                          <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                              Official Website
                            </div>
                            <a
                              href={wikidataDetails.website}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block break-all text-sm font-bold text-sky-700 underline"
                            >
                              {wikidataDetails.website}
                            </a>
                          </div>
                        ) : null}

                        {wikidataDetails.anthemLabel || wikidataDetails.anthemAudio ? (
                          <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                              Anthem
                            </div>
                            {wikidataDetails.anthemLabel ? (
                              <div className="mt-1 text-sm font-bold text-slate-900">
                                {wikidataDetails.anthemLabel}
                              </div>
                            ) : null}
                            {wikidataDetails.anthemAudio ? (
                              <audio controls className="mt-3 w-full">
                                <source src={wikidataDetails.anthemAudio} />
                              </audio>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={wikidataDetails.countryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
                      >
                        Open Wikidata
                      </a>
                      {wikidataDetails.website ? (
                        <a
                          href={wikidataDetails.website}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700 ring-1 ring-slate-200"
                        >
                          Visit Website
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
