import { LearningCardItem } from "@/lib/types";

function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function buildCountryFeatureIndex(items: LearningCardItem[]): Map<string, LearningCardItem> {
  const entries = items.flatMap((item) => {
    const featureIds = item.map?.featureIds ?? (item.map?.featureId ? [item.map.featureId] : []);
    return featureIds.map((featureId) => [featureId, item] as const);
  });

  return new Map(entries);
}

export function findCountryByFeatureId(
  items: LearningCardItem[],
  featureId: string,
): LearningCardItem | undefined {
  return buildCountryFeatureIndex(items).get(featureId);
}

export function filterCountriesByQuery(items: LearningCardItem[], query: string): LearningCardItem[] {
  const normalizedQuery = normalizeSearch(query);

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const haystacks = [
      item.name,
      item.attributes.capital,
      item.attributes.continent,
      item.attributes.subregion,
      item.attributes.countryCode,
    ];

    return haystacks.some((value) => normalizeSearch(value ?? "").includes(normalizedQuery));
  });
}
