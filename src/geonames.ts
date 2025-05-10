import readline from "readline";
import fs from "fs";
import { join } from "path";
import type { City } from "./interfaces";
import continents from "./continents.json";

export async function loadCities(): Promise<Record<string, City>> {
  const citiesByCountry: Record<string, City> = {};

  const rl = readline.createInterface({
    input: fs.createReadStream(join(process.cwd(), ".data/geonames.txt")),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line || line.startsWith("#")) continue;
    const parts = line.split("\t");

    const country = parts[8];
    const population = parseInt(parts[14]!, 10);
    const lat = parseFloat(parts[4]!);
    const lon = parseFloat(parts[5]!);
    const timezone = parts[17]!;

    if (!country || isNaN(population)) continue;

    // on garde la ville la plus peuplée par pays
    if (
      !citiesByCountry[country] ||
      citiesByCountry[country].population < population
    ) {
      citiesByCountry[country] = {
        continent: Object.keys(continents).find((code) =>
          continents[code as "AF"].includes(country)
        )!,
        name: parts[1]!,
        country,
        region: parts[10]!,
        lat,
        lon,
        population,
        timezone,
      };
    }
  }

  return citiesByCountry;
}
