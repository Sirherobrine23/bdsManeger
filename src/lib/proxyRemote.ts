import { proxyTcpToUdp } from "./proxy";

const args = process.argv.slice(2);
proxyTcpToUdp({
  listen: parseInt(args[2]||"0"),
  remote: {
    host: args[0],
    port: parseInt(args[1])
  }
});