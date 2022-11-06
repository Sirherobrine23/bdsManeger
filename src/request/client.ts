import { getJSON } from "@http/simples";

export type testIp<protocolType extends "ipv4"|"ipv6" = "ipv4"> = {
  ip: string,
  type: protocolType,
  subtype: string,
  via: string,
  padding: string,
  asn: string,
  asnlist: string,
  asn_name: string,
  country: string,
  protocol: "HTTP/2.0"|"HTTP/1.1"|"HTTP/1.0"
};

export async function getExternalIP(): Promise<{ipv4: string, ipv6?: string, rawRequest?: {ipv4: testIp<"ipv4">, ipv6?: testIp<"ipv6">}}> {
  const [ipv6, ipv4] = await Promise.all([
    await getJSON<testIp<"ipv6">>("https://ipv6.lookup.test-ipv6.com/ip/").catch(() => undefined),
    await getJSON<testIp<"ipv4">>("https://ipv4.lookup.test-ipv6.com/ip/")
  ]);
  return {
    ipv4: ipv4.ip,
    ipv6: ipv6?.ip,
    rawRequest: {ipv4, ipv6}
  };
}
