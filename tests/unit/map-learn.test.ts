import { describe, expect, it } from "vitest";

import { buildCountryFeatureIndex, filterCountriesByQuery, findCountryByFeatureId } from "@/lib/map-learn";
import { skillRepository } from "@/lib/repository";

describe("map learn helpers", () => {
  it("indexes countries by map feature id", () => {
    const countries = skillRepository.getItems("countries");
    const index = buildCountryFeatureIndex(countries);
    const afghanistan = countries.find((item) => item.id === "afghanistan");

    expect(afghanistan?.map?.featureId).toBeDefined();
    expect(index.get(afghanistan!.map!.featureId!)).toEqual(afghanistan);
  });

  it("finds a country by feature id", () => {
    const countries = skillRepository.getItems("countries");
    expect(findCountryByFeatureId(countries, "356")?.name).toBe("India");
  });

  it("filters countries by name, capital, and code", () => {
    const countries = skillRepository.getItems("countries");

    expect(filterCountriesByQuery(countries, "nairobi").some((item) => item.name === "Kenya")).toBe(true);
    expect(filterCountriesByQuery(countries, "JP").some((item) => item.name === "Japan")).toBe(true);
    expect(filterCountriesByQuery(countries, "south america").some((item) => item.name === "Brazil")).toBe(true);
  });
});
