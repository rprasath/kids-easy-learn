export type WikidataCountryDetails = {
  countryUrl: string;
  capital?: string;
  website?: string;
  officialLanguages: string[];
  spokenLanguages: string[];
  namedAfter: string[];
  anthemLabel?: string;
  anthemAudio?: string;
  coatOfArms?: string;
  pageBanner?: string;
  flagImage?: string;
};

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql?query=";

function toHttps(value: string | undefined): string | undefined {
  return value?.replace(/^http:/, "https:");
}

function splitJoinedValues(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function commonsImage(url: string, width: number): string {
  return `${toHttps(url)}?width=${width}px`;
}

export async function fetchWikidataCountryDetails(
  wikidataId: string,
  signal?: AbortSignal,
): Promise<WikidataCountryDetails | null> {
  const sparql = `
    SELECT
      (SAMPLE(?capitalLabel) AS ?capitalLabel)
      (SAMPLE(?website) AS ?website)
      (SAMPLE(?anthemLabel) AS ?anthemLabel)
      (SAMPLE(?anthemAudio) AS ?anthemAudio)
      (SAMPLE(?coatOfArms) AS ?coatOfArms)
      (SAMPLE(?pageBanner) AS ?pageBanner)
      (SAMPLE(?flag) AS ?flag)
      (GROUP_CONCAT(DISTINCT ?officialLanguageLabel; SEPARATOR=", ") AS ?officialLanguageLabels)
      (GROUP_CONCAT(DISTINCT ?spokenLanguageLabel; SEPARATOR=", ") AS ?spokenLanguageLabels)
      (GROUP_CONCAT(DISTINCT ?namedAfterLabel; SEPARATOR=", ") AS ?namedAfterLabels)
    WHERE {
      BIND(wd:${wikidataId} AS ?country)
      OPTIONAL { ?country wdt:P36 ?capital }.
      OPTIONAL { ?country wdt:P856 ?website }.
      OPTIONAL { ?country wdt:P85 ?anthem }.
      OPTIONAL { ?anthem wdt:P51 ?anthemAudio }.
      OPTIONAL { ?country wdt:P94 ?coatOfArms }.
      OPTIONAL { ?country wdt:P948 ?pageBanner }.
      OPTIONAL { ?country wdt:P41 ?flag }.
      OPTIONAL { ?country wdt:P37 ?officialLanguage }.
      OPTIONAL { ?country wdt:P2936 ?spokenLanguage }.
      OPTIONAL { ?country wdt:P138 ?namedAfter }.

      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en".
        ?capital rdfs:label ?capitalLabel .
        ?officialLanguage rdfs:label ?officialLanguageLabel .
        ?spokenLanguage rdfs:label ?spokenLanguageLabel .
        ?namedAfter rdfs:label ?namedAfterLabel .
        ?anthem rdfs:label ?anthemLabel .
      }
    }
  `;

  const response = await fetch(`${WIKIDATA_ENDPOINT}${encodeURIComponent(sparql)}`, {
    headers: { accept: "application/sparql-results+json" },
    signal,
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    results?: { bindings?: Array<Record<string, { value: string }>> };
  };
  const binding = json.results?.bindings?.[0];

  if (!binding) {
    return null;
  }

  return {
    countryUrl: `https://www.wikidata.org/wiki/${wikidataId}`,
    capital: binding.capitalLabel?.value,
    website: binding.website?.value,
    officialLanguages: splitJoinedValues(binding.officialLanguageLabels?.value),
    spokenLanguages: splitJoinedValues(binding.spokenLanguageLabels?.value),
    namedAfter: splitJoinedValues(binding.namedAfterLabels?.value),
    anthemLabel: binding.anthemLabel?.value,
    anthemAudio: toHttps(binding.anthemAudio?.value),
    coatOfArms: toHttps(binding.coatOfArms?.value),
    pageBanner: toHttps(binding.pageBanner?.value),
    flagImage: toHttps(binding.flag?.value),
  };
}
