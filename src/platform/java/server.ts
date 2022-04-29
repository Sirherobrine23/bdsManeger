export function parsePorts(data: string): {port: number; version?: "IPv4/IPv6"}|void {
  const portParse = data.match(/Starting\s+Minecraft\s+server\s+on\s+(.*)\:(\d+)/);
  if (!!portParse) {
    return {
      port: parseInt(portParse[2]),
      version: "IPv4/IPv6"
    };
  }
  return;
}