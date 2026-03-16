import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const worldCountries = require("world-countries");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const STATE_TAG_CLUES = {
  agriculture: "Farming is one of the clues many students connect with it.",
  capital: "State-capital study sheets often include it.",
  cities: "A major city there is often remembered in U.S. geography lessons.",
  coast: "Coastline is part of its map story.",
  culture: "Food, music, or festival traditions help people remember it.",
  dairy: "Dairy farms and cheese are part of what it is known for.",
  desert: "Dry desert land shapes much of its landscape.",
  forests: "Forests are a major part of its scenery.",
  history: "It is often remembered for an important piece of U.S. history.",
  islands: "Islands help make its geography stand out.",
  lakes: "Lakes are one of the map features tied to it.",
  landmarks: "A famous landmark is one of its best clues.",
  mountains: "Mountain landscapes help identify it.",
  music: "Music history is one of the clues often tied to it.",
  nature: "Natural landscapes are one of its strongest clues.",
  ocean: "The ocean is an important part of its identity.",
  parks: "National parks or protected land help make it memorable.",
  plains: "Wide plains are part of its landscape.",
  population: "It stands out for having a very large population.",
  prairie: "Prairie grasslands are part of its geography.",
  river: "A major river is closely tied to it.",
  size: "Its large size helps it stand out on a U.S. map.",
  sports: "A famous sports tradition helps identify it.",
  water: "Water is one of the geography clues often tied to it.",
};

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(rootDir, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  writeFileSync(path.join(rootDir, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeAscii(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function cleanLine(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();
}

function normalizeLine(line) {
  return cleanLine(normalizeAscii(line)).toLowerCase();
}

function lettersOnly(value) {
  return normalizeLine(value).replace(/[^a-z]/g, "");
}

function slugify(value) {
  return normalizeAscii(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
        .map((line) => cleanLine(line))
        .filter(Boolean),
    ),
  );
}

function uniqueTags(tags) {
  return [...new Set(tags.filter(Boolean))];
}

function hasAnswerLeak(line, answerName) {
  const answerKey = lettersOnly(answerName);

  if (!answerKey) {
    return false;
  }

  return lettersOnly(line).includes(answerKey);
}

function replaceAnswerReferences(line, answerName, replacement) {
  const escapedName = escapeRegExp(answerName);

  return cleanLine(
    line
      .replace(new RegExp(`\\b${escapedName}'s\\b`, "gi"), `${replacement}'s`)
      .replace(new RegExp(`\\b${escapedName}\\b`, "gi"), replacement),
  );
}

function sanitizeFactForClue(line, answerName, replacement) {
  return replaceAnswerReferences(line, answerName, replacement)
    .replace(/^The This\b/i, "This")
    .replace(/^A This\b/i, "This")
    .replace(/^An This\b/i, "This");
}

function factToClue(line, answerName, replacement) {
  const sanitized = sanitizeFactForClue(line, answerName, replacement).replace(/[.!?]+$/g, "");

  if (!sanitized) {
    return "";
  }

  return `A strong clue is that ${sanitized.charAt(0).toLowerCase()}${sanitized.slice(1)}.`;
}

function readClueOverlay(relativePath) {
  const overlay = readJson(relativePath);
  return overlay.cluesByItemId ?? {};
}

function finalizeClues(skillId, itemId, itemName, generatedClues, clueMap) {
  const authoredClues = uniqueLines(clueMap[itemId] ?? []);
  const clues = authoredClues.length >= 10 ? authoredClues : uniqueLines([...authoredClues, ...generatedClues]);

  if (clues.length < 10) {
    throw new Error(`Missing at least 10 quality clues for ${skillId}:${itemId}.`);
  }

  const leakingClue = clues.find((clue) => hasAnswerLeak(clue, itemName));

  if (leakingClue) {
    throw new Error(`Clue for ${skillId}:${itemId} contains the answer: "${leakingClue}"`);
  }

  return clues;
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
  return humanJoin(entries.slice(0, 2)) || "No single currency listed";
}

function getPrimaryLanguage(country) {
  return Object.values(country.languages ?? {})[0] ?? "";
}

function getPrimaryCurrency(country) {
  return Object.values(country.currencies ?? {})[0]?.name ?? "";
}

function getDemonym(country) {
  return country.demonyms?.eng?.m ?? country.demonyms?.eng?.f ?? "";
}

function getCallingCode(country) {
  const root = country.idd?.root ?? "";
  const suffix = country.idd?.suffixes?.[0] ?? "";
  return root && suffix ? `${root}${suffix}` : "";
}

function getDomain(country) {
  return country.tld?.[0] ?? "";
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

function getBorderClue(country) {
  const borderCount = (country.borders ?? []).length;

  if (borderCount === 0 && !country.landlocked) {
    return "It does not share a land border with any other country.";
  }

  if (borderCount === 1) {
    return "It shares a land border with just one country.";
  }

  if (borderCount > 1) {
    return `It shares land borders with ${borderCount} countries.`;
  }

  return "";
}

function getBorderFact(country) {
  const borderCount = (country.borders ?? []).length;

  if (borderCount === 0 && !country.landlocked) {
    return "It does not share a land border with another country.";
  }

  if (borderCount === 1) {
    return "It touches one neighboring country by land.";
  }

  if (borderCount > 1) {
    return `It touches ${borderCount} neighboring countries by land.`;
  }

  return "";
}

function getCountryWaterClue(country) {
  if (country.landlocked) {
    return "It is landlocked.";
  }

  if ((country.borders ?? []).length === 0) {
    return "It is an island country or made up of islands.";
  }

  return "It has a coastline.";
}

function getLatitudeClue(country) {
  const latitude = country.latlng?.[0];

  if (typeof latitude !== "number") {
    return "";
  }

  if (Math.abs(latitude) < 8) {
    return "It lies close to the Equator.";
  }

  return latitude > 0 ? "It is north of the Equator." : "It is south of the Equator.";
}

function getLongitudeClue(country) {
  const longitude = country.latlng?.[1];

  if (typeof longitude !== "number") {
    return "";
  }

  if (Math.abs(longitude) < 15) {
    return "It lies close to the Prime Meridian.";
  }

  return longitude > 0 ? "It is east of the Prime Meridian." : "It is west of the Prime Meridian.";
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

  return `Its area is about ${Math.round(country.area).toLocaleString("en-US")} square kilometers.`;
}

function getStateTagClues(tags) {
  return (tags ?? [])
    .map((tag) => STATE_TAG_CLUES[tag])
    .filter(Boolean);
}

function getContinentCountClue(item) {
  if (item.countryCount === 0) {
    return "It has no countries.";
  }

  return `It has about ${item.countryCount} countries.`;
}

function getContinentLargestCountryClue(item) {
  if (item.largestCountry === "No countries") {
    return "No country is larger there because no countries are located on it.";
  }

  return `Its largest country by area is ${item.largestCountry}.`;
}

function getContinentLargestCityClue(item) {
  if (item.largestCity === "No permanent cities") {
    return "It has research stations instead of permanent cities.";
  }

  return `A major city often linked with it is ${item.largestCity}.`;
}

function buildStateClues(item) {
  const nicknameWords = item.nickname.replace(/^The\s+/i, "").split(/\s+/).filter(Boolean);
  const capitalWords = item.capital.split(/\s+/).filter(Boolean);

  return uniqueLines([
    `Its capital city is ${item.capital}.`,
    `It is in the ${item.region.toLowerCase()} region of the United States.`,
    `Its official nickname is ${item.nickname}.`,
    `Its postal abbreviation is ${item.abbreviation}.`,
    factToClue(item.facts[0] ?? "", item.name, "This state"),
    factToClue(item.facts[1] ?? "", item.name, "This state"),
    ...getStateTagClues(item.tags),
    capitalWords[0] ? `Its capital begins with the letter ${capitalWords[0][0]}.` : "",
    capitalWords.at(-1) ? `Its capital ends with the letter ${capitalWords.at(-1).at(-1)}.` : "",
    `Its postal abbreviation starts with ${item.abbreviation[0]} and ends with ${item.abbreviation[1]}.`,
    `Its postal abbreviation uses the letters ${item.abbreviation[0]} and ${item.abbreviation[1]}.`,
    nicknameWords[0] ? `Its nickname begins with the letter ${nicknameWords[0][0]}.` : "",
    capitalWords.length > 0 ? `Its capital has ${capitalWords.length} word${capitalWords.length === 1 ? "" : "s"}.` : "",
    nicknameWords.length > 0 ? `Its nickname has ${nicknameWords.length} words.` : "",
    `Its region clue places it in the ${item.region.toLowerCase()} part of the country.`,
  ]).filter((clue) => !hasAnswerLeak(clue, item.name));
}

function buildContinentClues(item) {
  return uniqueLines([
    sanitizeFactForClue(item.facts[0] ?? "", item.name, "This continent"),
    sanitizeFactForClue(item.facts[1] ?? "", item.name, "This continent"),
    `It is mostly in the ${item.hemisphere} Hemisphere.`,
    getContinentCountClue(item),
    getContinentLargestCountryClue(item),
    getContinentLargestCityClue(item),
    "It is one of Earth's seven continents.",
    "Geography lessons place many countries on this large landmass.",
    ...((item.tags ?? []).map((tag) => `A clue often linked with it is ${tag}.`)),
    item.countryCount === 0
      ? "Scientists visit it, but people do not live there permanently in cities."
      : "It includes many places that students learn on world maps.",
  ]).filter((clue) => !hasAnswerLeak(clue, item.name));
}

function buildCountryClues(country, legacyContent, ranking) {
  const continent = normalizeContinent(country.region, country.subregion);
  const continentLabel = country.region === "Oceania" ? "Oceania" : continent;
  const capital = getCapital(country);
  const primaryLanguage = getPrimaryLanguage(country);
  const primaryCurrency = getPrimaryCurrency(country);
  const callingCode = getCallingCode(country);
  const domain = getDomain(country);
  const languageCount = Object.keys(country.languages ?? {}).length;
  const demonym = getDemonym(country);
  const clueAreaFact =
    ranking && !hasAnswerLeak(ranking.continentLabel, country.name.common)
      ? getAreaFact(country, ranking.rank, ranking.total, ranking.continentLabel)
      : "";

  return uniqueLines([
    !hasAnswerLeak(`It is in the ${country.subregion} part of ${continentLabel}.`, country.name.common)
      ? `It is in the ${country.subregion} part of ${continentLabel}.`
      : "",
    !hasAnswerLeak(`It is in ${continentLabel}.`, country.name.common) ? `It is in ${continentLabel}.` : "",
    capital !== "No official capital city" ? `Its capital city is ${capital}.` : "It does not have a single official capital city.",
    getCountryWaterClue(country),
    getBorderClue(country),
    clueAreaFact,
    ...((legacyContent?.facts ?? []).map((fact) => factToClue(fact, country.name.common, "This country"))),
    languageCount > 1 ? `It has ${languageCount} official languages listed.` : "",
    primaryLanguage && !hasAnswerLeak(`One official language there is ${primaryLanguage}.`, country.name.common)
      ? `One official language there is ${primaryLanguage}.`
      : "",
    primaryCurrency && !hasAnswerLeak(`Its currency is ${primaryCurrency}.`, country.name.common)
      ? `Its currency is ${primaryCurrency}.`
      : "",
    `Its two-letter country code is ${country.cca2}.`,
    domain ? `Its internet domain ends with "${domain}".` : "",
    callingCode ? `International phone calls there begin with the code ${callingCode}.` : "",
    getLatitudeClue(country),
    getLongitudeClue(country),
    demonym && !hasAnswerLeak(`People from there are called ${demonym}.`, country.name.common)
      ? `People from there are called ${demonym}.`
      : "",
    country.flag ? `Its flag emoji is ${country.flag}.` : "",
  ]).filter((clue) => !hasAnswerLeak(clue, country.name.common));
}

function transformStates() {
  const legacy = readJson("data/sources/states-legacy.json");
  const clueMap = readClueOverlay("data/authoring/states-clues.json");

  return {
    skillId: "states",
    version: 4,
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
        `${item.capital} is an important city name to remember on a U.S. map.`,
      ]).slice(0, 3),
      clues: finalizeClues("states", item.id, item.name, buildStateClues(item), clueMap),
      tags: item.tags ?? [],
    })),
  };
}

function transformContinents() {
  const legacy = readJson("data/sources/continents-legacy.json");
  const clueMap = readClueOverlay("data/authoring/continents-clues.json");

  return {
    skillId: "continents",
    version: 4,
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
        item.largestCountry !== "No countries"
          ? `${item.largestCountry} is the largest country on this continent by land area.`
          : "No countries are located there.",
        item.largestCity !== "No permanent cities"
          ? `${item.largestCity} is one of the major cities learners often connect with this continent.`
          : "It does not have permanent cities.",
      ]).slice(0, 5),
      funFacts: uniqueLines([
        "This is one of the seven large land areas on Earth.",
        item.countryCount === 0
          ? "Scientists use research stations there instead of permanent cities."
          : `${item.countryCount} is the approximate number of countries students usually learn for it.`,
        item.tags?.[0] ? `A common clue linked to it is ${item.tags[0]}.` : "",
      ]).slice(0, 3),
      clues: finalizeClues("continents", item.id, item.name, buildContinentClues(item), clueMap),
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
    const continentLabel = countries[0]?.region === "Oceania" ? "Oceania" : continent;

    sorted.forEach((country, index) => {
      ranksByCountryCode.set(country.cca3, {
        rank: index + 1,
        total: sorted.length,
        continentLabel,
      });
    });
  });

  return {
    skillId: "countries",
    version: 4,
    items: chosenCountries.map((country) => {
      const id = slugify(country.name.common);
      const continent = normalizeContinent(country.region, country.subregion);
      const capital = getCapital(country);
      const officialLanguage = getOfficialLanguage(country);
      const currency = getCurrency(country);
      const ranking = ranksByCountryCode.get(country.cca3);
      const legacyContent = legacyFactsById.get(id);
      const subregion = country.subregion || continent;
      const flag = country.flag || "";
      const landlocked = country.landlocked ? "Yes" : "No";
      const callingCode = getCallingCode(country);
      const domain = getDomain(country);
      const borderFact = getBorderFact(country);
      const geographyLabel = country.region === "Oceania" ? "Oceania" : continent;

      const facts = uniqueLines([
        ...(legacyContent?.facts ?? []),
        capital !== "No official capital city"
          ? `The national government is based in ${capital}.`
          : "It does not have one single official capital city.",
        `It is in ${subregion}, part of ${geographyLabel}.`,
        getWaterFact(country),
        `Its land area is roughly ${Math.round(country.area).toLocaleString("en-US")} square kilometers.`,
        borderFact,
      ]).slice(0, 5);

      const funFacts = uniqueLines([
        flag ? `The flag emoji for it is ${flag}.` : "",
        domain ? `Websites there often use the domain ending "${domain}".` : "",
        callingCode ? `Its international dialing code begins with ${callingCode}.` : "",
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
        clues: finalizeClues(
          "countries",
          id,
          country.name.common,
          buildCountryClues(country, legacyContent, ranking),
          clueMap,
        ),
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
