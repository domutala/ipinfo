import { fetchAsn, getAsnFromIp } from "./asn";
import { resolveReverseDNS } from "./dns";
import { lookupIp } from "./ip";

(async () => {
  // mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  // await fetchAsn();
  // console.log("***");

  const ip = "196.115.112.145";
  const ipv4Range = lookupIp(ip);

  if (ipv4Range) {
    const asnPrefix = getAsnFromIp(ipv4Range.ip);

    if (asnPrefix) {
      const hostname = await resolveReverseDNS(ip);
      console.log({
        ...asnPrefix,
        geo: ipv4Range,
        hostname,
      });
    }
  }
})();
