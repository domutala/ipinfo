import type { IpRecord } from "./interfaces";
import { appendFileSync, readFileSync, writeFileSync } from "fs";
import { Netmask } from "netmask";
import { join } from "path";
import ping from "ping";

export function* generateIPv4Range(
  startIp: string,
  count: number
): Generator<string> {
  let ip = ipToInt(startIp);

  for (let i = 0; i < count; i++) {
    yield intToIp(ip + i);
  }
}

// Utilitaires
export function ipToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

export function intToIp(int: number): string {
  return [24, 16, 8, 0].map((shift) => (int >> shift) & 255).join(".");
}

export async function saveAllIps() {
  writeFileSync(join(process.cwd(), ".data/ips.txt"), "");

  const ipRecords = JSON.parse(
    readFileSync(join(process.cwd(), ".data/ip_enriched.json"), "utf-8")
  ) as IpRecord[];

  ipRecords.map((ir) => ir.count);
  const total = ipRecords.reduce((acc, curr) => acc + curr.count, 0);
  let part = 0;

  for (const record of ipRecords) {
    for (const ip of generateIPv4Range(record.ip, record.count)) {
      part++;

      ping.promise.probe(ip).then((res) => {
        const percent = (part / total) * 100;
        const partFormat = Intl.NumberFormat().format(part);
        const formatTotal = Intl.NumberFormat().format(part);
        const formatRest = Intl.NumberFormat().format(total - part);

        if (res.alive) {
          appendFileSync(join(process.cwd(), ".data/ips.txt"), ip + "\n");
        }

        console.log(
          `${partFormat} (${percent.toFixed(
            2
          )}%) on ${formatTotal} | ${formatRest} again`
        );
      });

      if (part === 2000) return;
    }
  }
}

export function findIpRecord(ip: string, records: IpRecord[]): IpRecord | null {
  const ipInt = ipToInt(ip);

  for (const record of records) {
    const startInt = ipToInt(record.ip);
    const endInt = startInt + record.count - 1;

    if (ipInt >= startInt && ipInt <= endInt) {
      return record;
    }
  }

  return null;
}

export function lookupIp(ip: string) {
  const raw = readFileSync(
    join(process.cwd(), ".data/ipv4_ranges.json"),
    "utf8"
  );
  const records: IpRecord[] = JSON.parse(raw);

  const match = findIpRecord(ip, records);
  if (match) {
    match.ip = ip;
    return match;
  }
}

export function ipInPrefix(ip: string, prefix: string): boolean {
  try {
    const block = new Netmask(prefix);
    return block.contains(ip);
  } catch {
    return false;
  }
}
