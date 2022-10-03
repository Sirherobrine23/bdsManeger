import dgram from "node:dgram";
import net from "node:net";

export type proxyUdpToTcpOptions = {
  udpType?: dgram.SocketType,
  listen?: number,
  portListen?: (port: number) => void
};

export type proxyTcpToUdpClient = {
  udpType?: dgram.SocketType,
  listen?: number,
  remote: {
    host: string,
    port: number
  },
};

export function proxyUdpToTcp(udpPort: number, options?: proxyUdpToTcpOptions) {
  const tcpServer = net.createServer();
  tcpServer.on("connection", socket => {
    const udpClient = dgram.createSocket(options?.udpType||"udp4");
    socket.once("close", () => udpClient.close());
    udpClient.once("close", () => socket.end());
    udpClient.on("message", data => socket.write(data));
    udpClient.connect(udpPort);
  });
  tcpServer.listen(options?.listen||0, function() {
    const addr = this.address();
    if (options?.portListen) options.portListen(addr.port);
    console.log("Port listen, %s", addr.port);
  });
}

export function proxyTcpToUdp(options: proxyTcpToUdpClient) {
  const udp = dgram.createSocket(options?.udpType||"udp4");
  udp.bind(options.listen||0, function(){const addr = this.address(); console.log("Port listen, %s", addr.port);});
  const sessions: {[keyIP: string]: net.Socket} = {};
  udp.on("message", (msg, ipInfo) => {
    const keyInfo = `${ipInfo.address}:${ipInfo.port}`;
    if (!sessions[keyInfo]) {
      sessions[keyInfo] = net.createConnection(options.remote);
      sessions[keyInfo].on("data", data => udp.send(data, ipInfo.port, ipInfo.address));
    }
    sessions[keyInfo].write(msg);
  });
}