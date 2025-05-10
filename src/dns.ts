import { reverse } from "dns/promises";
import { exec, execSync } from "child_process";
import type { WhoisInfos } from "./interfaces";
import whoisJson from "whois-json";

export async function resolveReverseDNS(ip: string) {
  try {
    const [fqdn] = await reverse(ip);
    return fqdn;
  } catch (e) {
    return null;
  }
}

export async function whois(ip: string) {
  const result = await whoisJson(ip.split("/").at(0)!);

  return result;
}

export function whoisOld(ip: string) {
  return new Promise(async (resolve, reject) => {
    exec(`whois ${ip}`, (error, stdout) => {
      if (error) return reject(error);

      function parser() {
        const result: Record<string, string> = {};
        // console.log(stdout);

        const lines = stdout.split("\n");
        for (const line of lines) {
          const match = line.match(/^([\w.-]+):\s+(.+)$/);
          if (match) {
            const key = match.at(1)?.trim().toLowerCase();
            const value = match.at(2)?.trim();

            if (key && value) {
              result[key] = value;

              if (key === "netrange") {
                result.ipStart = value.split(" - ")[0]!;
                result.ipEnd = value.split(" - ")[1]!;
              }
            }
          }
        }

        return result as any as WhoisInfos;
      }

      const details = parser();
      resolve(details);
    });
  });
}
