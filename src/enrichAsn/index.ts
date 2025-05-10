import { URL } from "url";
import pLimit from "p-limit";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { parseArgs } from "util";
import { exec } from "child_process";

const raw = readFileSync(join(process.cwd(), ".data/routeviews.txt"), "utf-8");
const lines = raw.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
const nInstances = Math.round(lines.length / 10_000);

for (let i = 0; i < nInstances; i++) {
  const cmd = `bun run src/enrichAsn/enrich.ts --startAt ${i * 10_000}`;
  console.log(i);

  exec(cmd);
}
