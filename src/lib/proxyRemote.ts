import { proxyTcpToUdp } from "./proxy";

const args = process.argv.slice(2);
proxyTcpToUdp({
  remote: {
    host: args[0],
    port: parseInt(args[1])
  }
});