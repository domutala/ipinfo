import { URL } from "url";
import pLimit from "p-limit";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { v4 } from "uuid";

export default async function enrichAsn() {
  mkdirSync("/temp/enrinch-ans", { recursive: true });
  const target_file = `/temp/enrinch-ans/${v4()}.json`;

  const startAt = parseInt(process.env.START_AT);
  const BATCH_SIZE = 1000;

  // Exemple : 84 requêtes en parallèle
  const CONCURRENCY_LIMIT = process.env.CONCURRENCY_LIMIT ?? 84;
  const limit = pLimit(parseInt(CONCURRENCY_LIMIT.toString()));

  const raw = readFileSync(join(process.cwd(), process.env.FILE), "utf-8");
  const lines = raw
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .slice(startAt, startAt + 10_000);
  // .slice(0, 100);

  const ansDatabase: { asn: number; asName: string; orgId: string }[] =
    JSON.parse(
      readFileSync(join(process.cwd(), ".data/asn_database.json"), "utf8")
    );

  // On initialise un tableau pour collecter les résultats
  let results: any[] = [];
  let counter = 0;

  function maybeFlushBatch(force = false) {
    if (!existsSync(target_file)) writeFileSync(target_file, "[]");

    if (results.length >= BATCH_SIZE || force) {
      const e = JSON.parse(readFileSync(target_file, "utf8")) as any[];

      e.push(...results);
      writeFileSync(target_file, JSON.stringify(e));

      results = [];
    }
  }

  async function fetchWhoisRdap(line: string): Promise<void> {
    counter++;

    const start = performance.now(); // Mesure du début
    const cols = line.trim().split(/\s+/);
    const [ip, prefix, asnStr] = cols;
    const asn = parseInt(asnStr!, 10);

    try {
      const whois = await whoisRdap(ip);
      const data = await ansRdap(asn);

      const type =
        (asn >= 64512 && asn <= 65534) ||
        (asn >= 4200000000 && asn <= 4294967294)
          ? "private"
          : "public";

      const _asn = ansDatabase.find((entry) => entry.asn === asn);

      const _data = {
        prefix: `${ip}/${prefix}`,
        asn: parseInt(asnStr, 10),

        data,
        type,
        whois,
        ..._asn,
      };

      // Ajout des résultats dans le tableau
      results.push(_data);
      maybeFlushBatch();

      console.log(`[ ✔ ] ${ip}`);
    } catch (error) {
      console.error(`[ ✖ ] ${ip} → ${(error as any).message}`);
    } finally {
      const end = performance.now(); // Mesure de la fin
      const duration = (end - start).toFixed(2); // Calcul de la durée

      const percent = (counter / lines.length) * 100;
      const counterFormat = Intl.NumberFormat().format(counter);
      const formatTotal = Intl.NumberFormat().format(counter);
      const formatRest = Intl.NumberFormat().format(lines.length - counter);
      const done = Intl.NumberFormat().format(results.length);

      console.log(
        `${counterFormat} (${percent.toFixed(2)}%) | done ✔ ${
          results.length
        } | ${formatRest} again`
      );

      console.log(`[ ⏱ ] ${ip} → duration: ${duration}ms`);
    }

    async function $fetch(url: string, options: RequestInit = {}) {
      const timeout = 10000;

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);

      return response;
    }

    async function whoisRdap(ip: string) {
      try {
        const url = new URL(`https://rdap.org/ip/${ip}`);
        const response = await $fetch(url.toString(), {
          method: "GET",
          headers: { "User-Agent": "whois-ts-bot/1.0" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err: any) {
        throw new Error(`Failed to fetch WHOIS data: ${err.message}`);
      }
    }

    async function ansRdap(asn: number) {
      try {
        const url = new URL(`https://rdap.org/autnum/${asn}`);
        const response = await $fetch(url.toString(), {
          method: "GET",
          headers: { "User-Agent": "whois-ts-bot/1.0" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err: any) {
        throw new Error(`Failed to fetch ASN details: ${err.message}`);
      }
    }
  }

  async function main() {
    console.time("Execution");

    const tasks = lines.map((line, index) => limit(() => fetchWhoisRdap(line)));

    // Attend que toutes les tâches soient terminées
    await Promise.all(tasks);

    maybeFlushBatch(true);

    console.timeEnd("Execution");
  }

  await main();
}

(async () => {
  await enrichAsn();
})();
