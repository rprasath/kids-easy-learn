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

function buildStateClues(item) {
  return [
    "This place is a U.S. state.",
    `Its capital city is ${item.capital}.`,
    `It belongs to the ${item.region} region.`,
    `Its nickname is ${item.nickname}.`,
    `Its two-letter abbreviation is ${item.abbreviation}.`,
    `On a U.S. map, it is grouped with the ${item.region}.`,
    `The state government meets in ${item.capital}.`,
    `Mail can be labeled with the code ${item.abbreviation}.`,
    `School quizzes often pair this state with ${item.capital}.`,
    `This clue card points to a state in the ${item.region}.`,
    `The nickname ${item.nickname} belongs to this state.`,
    `Students often memorize ${item.abbreviation} as this state's short code.`,
    `If the answer is a state from the ${item.region}, this one fits.`,
    `One strong clue for this state is the capital ${item.capital}.`,
    `The correct answer uses the abbreviation ${item.abbreviation}.`,
  ];
}

function buildContinentClues(item) {
  return [
    "This place is one of the seven continents.",
    `It is mostly in the ${item.hemisphere} hemisphere.`,
    `It has about ${item.countryCount} countries.`,
    `Its largest country is ${item.largestCountry}.`,
    `A major city linked with it is ${item.largestCity}.`,
    "Geography lessons group many countries inside this continent.",
    "On a globe, this answer is a major land area.",
    `Students often connect it with ${item.largestCountry}.`,
    `The city ${item.largestCity} helps identify this continent.`,
    `It is taught as a continent mostly in the ${item.hemisphere}.`,
    `World maps show this continent with about ${item.countryCount} countries.`,
    `${item.largestCountry} is a strong clue for this continent.`,
    `If the hemisphere clue is ${item.hemisphere}, this could be the answer.`,
    `The city clue ${item.largestCity} points toward this continent.`,
    "This answer is not a country or state; it is a continent.",
  ];
}

function buildCountryClues({ capital, continent, subregion, officialLanguage, currency, countryCode, flag, landlocked }) {
  return [
    "This place is a country.",
    `It is in ${continent}.`,
    `It is in the ${subregion} part of ${continent}.`,
    `Its capital city is ${capital}.`,
    `One official language is ${officialLanguage}.`,
    `Its currency is ${currency}.`,
    `Its two-letter country code is ${countryCode}.`,
    `Its flag emoji is ${flag}.`,
    `The government works from ${capital}.`,
    `World map lessons place it in ${continent}.`,
    `The language clue ${officialLanguage} is linked with this country.`,
    `The code ${countryCode} belongs to this country.`,
    `The landlocked clue says ${landlocked}.`,
    `This country is found in ${subregion}.`,
    `The flag clue for this country is ${flag}.`,
  ];
}

function transformStates() {
  const legacy = readJson("data/sources/states-legacy.json");

  return {
    skillId: "states",
    version: 2,
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
      facts: [
        ...item.facts,
        `${item.capital} is the state capital that students match with ${item.name}.`,
        `${item.nickname} is a nickname that helps learners remember ${item.name}.`,
      ],
      funFacts: [
        `${item.abbreviation} is the two-letter mail code for ${item.name}.`,
        `${item.capital} is an important map city to remember in ${item.name}.`,
        `${item.name} is often grouped with other ${item.region.toLowerCase()} states in school map lessons.`,
      ],
      clues: buildStateClues(item),
      tags: item.tags ?? [],
    })),
  };
}

function transformContinents() {
  const legacy = readJson("data/sources/continents-legacy.json");

  return {
    skillId: "continents",
    version: 2,
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
      facts: [
        ...item.facts,
        `${item.largestCountry} is the largest country in ${item.name} by area.`,
        `${item.largestCity} is a major city name students can connect with ${item.name}.`,
      ],
      funFacts: [
        `${item.name} appears on world maps as one of the seven large land areas on Earth.`,
        `${item.countryCount} is the approximate number of countries students learn for ${item.name}.`,
        `${item.largestCountry} and ${item.largestCity} are both useful names to remember in ${item.name}.`,
      ],
      clues: buildContinentClues(item),
      tags: item.tags ?? [],
    })),
  };
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
    return `${country.name.common} is landlocked, which means it does not have its own ocean coastline.`;
  }

  if ((country.borders ?? []).length === 0) {
    return `${country.name.common} is made up of islands or island-like territory and is surrounded by water.`;
  }

  return `${country.name.common} has a coastline or sea access, so students can spot it near water on many maps.`;
}

function getAreaFact(country, continentRank, continentTotal, continentName) {
  if (continentRank === 1) {
    return `${country.name.common} is the largest country in ${continentName} by area.`;
  }

  if (continentRank <= 3) {
    return `${country.name.common} is one of the larger countries in ${continentName} by area.`;
  }

  if (continentRank >= continentTotal - 1) {
    return `${country.name.common} is one of the smaller countries in ${continentName} by area.`;
  }

  return `${country.name.common} has its own size and shape that help students recognize it on a world map.`;
}

function transformCountries() {
  const legacy = readJson("data/sources/countries-legacy.json");
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
    version: 2,
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

      const facts = [
        ...(legacyContent?.facts ?? []),
        `${country.name.common} is in ${subregion}, part of ${continent}.`,
        `${capital} is the capital city of ${country.name.common}.`,
        demonym ? `People from ${country.name.common} are called ${demonym}.` : "",
        getWaterFact(country),
        ranking ? getAreaFact(country, ranking.rank, ranking.total, ranking.continent) : "",
      ].filter(Boolean);

      const funFacts = [
        `The flag for ${country.name.common} is ${flag}.`,
        `${country.cca2} is the two-letter code and ${country.cca3} is the three-letter code for ${country.name.common}.`,
        `${capital} is a key city name to connect with ${country.name.common}.`,
      ];

      const clues = buildCountryClues({
        capital,
        continent,
        subregion,
        officialLanguage,
        currency,
        countryCode: country.cca2,
        flag,
        landlocked,
      });

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
        facts: facts.slice(0, 5),
        funFacts,
        clues,
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

function uniqueTags(tags) {
  return [...new Set(tags.filter(Boolean))];
}

writeJson("data/skills/states/states.json", transformStates());
writeJson("data/skills/continents/continents.json", transformContinents());
writeJson("data/skills/countries/countries.json", transformCountries());
