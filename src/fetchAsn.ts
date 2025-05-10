import { mkdirSync } from "fs";
import { fetchAsn } from "./asn";
import { join } from "path";

(async () => {
  mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  await fetchAsn();
})();
