import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const worldCountries = require("world-countries");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(rootDir, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  writeFileSync(path.join(rootDir, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function humanJoin(values) {
  const filtered = values.filter(Boolean);

  if (filtered.length <= 1) {
    return filtered[0] ?? "";
  }

  if (filtered.length === 2) {
    return `${filtered[0]} and ${filtered[1]}`;
  }

  return `${filtered.slice(0, -1).join(", ")}, and ${filtered.at(-1)}`;
}

function uniqueLines(lines) {
  return Array.from(
    new Set(
      lines
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  );
}

function uniqueTags(tags) {
  return [...new Set(tags.filter(Boolean))];
}

function readClueOverlay(relativePath) {
  const overlay = readJson(relativePath);

  return overlay.cluesByItemId ?? {};
}

function cluesForItem(skillId, itemId, clueMap) {
  const clues = clueMap[itemId];

  if (!Array.isArray(clues) || clues.length < 10) {
    throw new Error(`Missing at least 10 authored clues for ${skillId}:${itemId}.`);
  }

  return uniqueLines(clues);
}

function normalizeContinent(region, subregion) {
  if (region === "Americas") {
    return subregion?.includes("South") ? "South America" : "North America";
  }

  if (region === "Oceania") {
    return "Australia";
  }

  return region;
}

function getCapital(country) {
  if (country.name.common === "Nauru") {
    return "Yaren";
  }

  return country.capital?.[0] ?? "No official capital city";
}

function getOfficialLanguage(country) {
  const languages = Object.values(country.languages ?? {});
  return humanJoin(languages.slice(0, 3)) || "No single official language listed";
}

function getCurrency(country) {
  const entries = Object.values(country.currencies ?? {}).map((entry) => entry.name);
  return humanJoin(entries.slice(0, 3)) || "No single currency listed";
}

function getDemonym(country) {
  return country.demonyms?.eng?.m ?? country.demonyms?.eng?.f ?? "";
}

function getWaterFact(country) {
  if (country.landlocked) {
    return "This country is landlocked, so it does not have its own ocean coastline.";
  }

  if ((country.borders ?? []).length === 0) {
    return "This country is surrounded by water or made up of islands.";
  }

  return "This country has a coastline or sea access that shows up on many maps.";
}

function getAreaFact(country, continentRank, continentTotal, continentName) {
  if (continentRank === 1) {
    return `It is the largest country in ${continentName} by area.`;
  }

  if (continentRank <= 3) {
    return `It is one of the larger countries in ${continentName} by area.`;
  }

  if (continentRank >= continentTotal - 1) {
    return `It is one of the smaller countries in ${continentName} by area.`;
  }

  return "Its size and shape help students recognize it on a world map.";
}

function transformStates() {
  const legacy = readJson("data/sources/states-legacy.json");
  const clueMap = readClueOverlay("data/authoring/states-clues.json");

  return {
    skillId: "states",
    version: 3,
    items: legacy.items.map((item) => ({
      id: item.id,
      skillId: "states",
      name: item.name,
      attributes: {
        capital: item.capital,
        region: item.region,
        nickname: item.nickname,
        abbreviation: item.abbreviation,
      },
      facts: uniqueLines([
        ...item.facts,
        `${item.capital} is the state capital.`,
        `${item.nickname} is the official nickname.`,
      ]).slice(0, 5),
      funFacts: uniqueLines([
        `${item.abbreviation} is the two-letter postal code used for this state.`,
        `${item.capital} is an important city to remember on a U.S. map.`,
        `School geography lessons often group it with the ${item.region.toLowerCase()} states.`,
      ]).slice(0, 3),
      clues: cluesForItem("states", item.id, clueMap),
      tags: item.tags ?? [],
    })),
  };
}

function transformContinents() {
  const legacy = readJson("data/sources/continents-legacy.json");
  const clueMap = readClueOverlay("data/authoring/continents-clues.json");

  return {
    skillId: "continents",
    version: 3,
    items: legacy.items.map((item) => ({
      id: item.id,
      skillId: "continents",
      name: item.name,
      attributes: {
        hemisphere: item.hemisphere,
        countryCount: String(item.countryCount),
        largestCountry: item.largestCountry,
        largestCity: item.largestCity,
      },
      facts: uniqueLines([
        ...item.facts,
        `${item.largestCountry} is the largest country there by area.`,
        `${item.largestCity} is one major city often connected with it.`,
      ]).slice(0, 5),
      funFacts: uniqueLines([
        "This is one of the seven large land areas on Earth.",
        `${item.countryCount} is the approximate number of countries students usually learn for it.`,
        `${item.largestCountry} and ${item.largestCity} are useful geography names to remember.`,
      ]).slice(0, 3),
      clues: cluesForItem("continents", item.id, clueMap),
      tags: item.tags ?? [],
    })),
  };
}

function transformCountries() {
  const legacy = readJson("data/sources/countries-legacy.json");
  const clueMap = readClueOverlay("data/authoring/countries-clues.json");
  const legacyFactsById = new Map(
    legacy.items.map((item) => [item.id, { facts: item.facts ?? [], tags: item.tags ?? [] }]),
  );

  const chosenCountries = worldCountries
    .filter((country) => country.unMember || country.name.common === "Palestine")
    .sort((left, right) => left.name.common.localeCompare(right.name.common));

  const continentGroups = new Map();

  chosenCountries.forEach((country) => {
    const continent = normalizeContinent(country.region, country.subregion);
    const group = continentGroups.get(continent) ?? [];
    group.push(country);
    continentGroups.set(continent, group);
  });

  const ranksByCountryCode = new Map();

  continentGroups.forEach((countries, continent) => {
    const sorted = [...countries].sort((left, right) => right.area - left.area);
    sorted.forEach((country, index) => {
      ranksByCountryCode.set(country.cca3, {
        rank: index + 1,
        total: sorted.length,
        continent,
      });
    });
  });

  return {
    skillId: "countries",
    version: 3,
    items: chosenCountries.map((country) => {
      const id = slugify(country.name.common);
      const continent = normalizeContinent(country.region, country.subregion);
      const capital = getCapital(country);
      const officialLanguage = getOfficialLanguage(country);
      const currency = getCurrency(country);
      const demonym = getDemonym(country);
      const ranking = ranksByCountryCode.get(country.cca3);
      const legacyContent = legacyFactsById.get(id);
      const subregion = country.subregion || continent;
      const flag = country.flag || "";
      const landlocked = country.landlocked ? "Yes" : "No";

      const facts = uniqueLines([
        ...(legacyContent?.facts ?? []),
        `The national government is based in ${capital}.`,
        `It is in ${subregion}, part of ${continent}.`,
        demonym ? `People from there are called ${demonym}.` : "",
        getWaterFact(country),
        ranking ? getAreaFact(country, ranking.rank, ranking.total, ranking.continent) : "",
      ]).slice(0, 5);

      const funFacts = uniqueLines([
        flag ? `Students may recognize it by the flag emoji ${flag}.` : "A flag emoji is not listed for it.",
        `${country.cca2} is the two-letter country code and ${country.cca3} is the three-letter code.`,
        `${capital} is a key city name that helps many learners remember this country.`,
      ]).slice(0, 3);

      return {
        id,
        skillId: "countries",
        name: country.name.common,
        badge: flag,
        attributes: {
          flag,
          capital,
          continent,
          subregion,
          officialLanguage,
          currency,
          countryCode: country.cca2,
          landlocked,
        },
        facts,
        funFacts,
        clues: cluesForItem("countries", id, clueMap),
        tags: uniqueTags([
          slugify(continent),
          slugify(subregion),
          country.landlocked ? "landlocked" : "coast",
          ...(legacyContent?.tags ?? []),
        ]),
      };
    }),
  };
}

writeJson("data/skills/states/states.json", transformStates());
writeJson("data/skills/continents/continents.json", transformContinents());
writeJson("data/skills/countries/countries.json", transformCountries());
