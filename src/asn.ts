import type { AsnEntry, AsnRecord, PrefixEntry } from "./interfaces";
import { readFileSync, writeFileSync } from "fs";
import { ipInPrefix } from "./ip";
import { join } from "path";
import enrichAsn from "./enrichAsn";
import { loadCities } from "./geonames";
import currencies from "./currencies.json";

const cities = await loadCities();

// URLs des fichiers des RIRs
const RIR_SOURCES: Record<string, string> = {
  arin: "https://ftp.arin.net/pub/stats/arin/delegated-arin-extended-latest",
  ripe: "https://ftp.ripe.net/pub/stats/ripencc/delegated-ripencc-latest",
  apnic: "https://ftp.apnic.net/pub/stats/apnic/delegated-apnic-latest",
  lacnic: "https://ftp.lacnic.net/pub/stats/lacnic/delegated-lacnic-latest",
  afrinic: "https://ftp.afrinic.net/pub/stats/afrinic/delegated-afrinic-latest",
};

async function fetchAndParse() {
  for (const [rir, url] of Object.entries(RIR_SOURCES)) {
    try {
      await _fetch(rir, url);
    } catch (err) {
      console.error(`Erreur lors du traitement de ${rir}:`, err);
    }
  }

  async function _fetch(rir: string, url: string) {
    console.log(`Téléchargement de ${rir}...`);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status} pour ${rir}`);

    const text = await res.text();
    const lines = text.split("\n");

    const ipv4Records = [];

    for (const line of lines) {
      if (line.startsWith("#") || line.trim() === "") continue;

      const parts = line.split("|");
      if (parts.length < 7) continue;

      const [source, country, type, start, value, , status] = parts;

      if (type === "ipv4" && status === "allocated") {
        const city = cities[country];
        // if (!city) return record;

        ipv4Records.push({
          rir: source,
          country,
          ip: start,
          count: parseInt(value, 10),

          continent: city?.continent,
          city: city?.name,
          region: city?.region,
          lat: city?.lat,
          lon: city?.lon,

          currency: currencies[city?.country as "SN"],
        });
      }
    }

    writeFileSync(
      join(process.cwd(), ".data/ipv4_ranges.json"),
      JSON.stringify(ipv4Records)
    );
  }
}

export function parseAsnFile() {
  type AsnEntry = {
    asn: number;
    asName: string;
    orgId: string;
  };

  type OrgEntry = {
    orgId: string;
    orgName: string;
    country: string;
  };

  const content = readFileSync(join(process.cwd(), ".data/rirs.txt"), "utf-8");
  const lines = content
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"));

  const asnMap: Map<number, AsnEntry> = new Map();
  const orgMap: Map<string, OrgEntry> = new Map();

  for (const line of lines) {
    const parts = line.split("|");
    // Ligne ASN → OrgID (ex: 13335|20120224|CLOUDFLARENET|ORG-CLFL|...|ARIN)
    if (/^\d+$/.test(parts[0]!)) {
      const [asnStr, , asName, orgId] = parts;
      asnMap.set(parseInt(asnStr!), {
        asn: parseInt(asnStr!),
        asName: asName!,
        orgId: orgId!,
      });
    }

    // Ligne OrgID → infos (ex: ORG-CLFL|20120130|Cloudflare, Inc.|US|ARIN)
    else if (parts.length >= 5) {
      const [orgId, , orgName, country] = parts;
      orgMap.set(orgId!, { orgId, orgName, country });
    }
  }

  // Fusion des deux sources
  const result: AsnRecord[] = [];

  for (const [asn, asnEntry] of asnMap.entries()) {
    const org = orgMap.get(asnEntry.orgId);
    result.push({
      asn,
      name: asnEntry.asName,
      organization: org?.orgName || "Inconnu",
      country: org?.country || "??",
    });
  }

  writeFileSync(
    join(process.cwd(), ".data/asn_database.json"),
    JSON.stringify(result, null, 2)
  );
  console.log("✅ Base ASN enregistrée : asn_database.json");
}

export async function fetchAsn() {
  await fetchAndParse();

  parseAsnFile();

  await enrichAsn();
}

export function lookupAsn(asn: number) {
  const db: AsnEntry[] = JSON.parse(
    readFileSync(join(process.cwd(), ".data/asn_database.json"), "utf8")
  );
  return db.find((entry) => entry.asn === asn) || null;
}

export function getAsnFromIp(ip: string) {
  const prefixList = JSON.parse(
    readFileSync(join(process.cwd(), ".data/ans_ip_prefix.json"), "utf-8")
  ) as PrefixEntry[];

  const candidates = prefixList.filter((entry) => ipInPrefix(ip, entry.prefix));
  if (candidates.length === 0) return null;

  // Trie par spécificité de masque (plus précis d'abord)
  const bestMatch = candidates.sort(
    (a, b) =>
      parseInt(b.prefix.split("/")[1]!) - parseInt(a.prefix.split("/")[1]!)
  )[0]!;

  return bestMatch;
}
