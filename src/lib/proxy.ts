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

/**
 * Transfer packets from UDP to TCP to send through some tunnel that only accepts TCP
 *
 * This also means that it will also have error transporting the data, so it is not guaranteed to work properly even more when dealing with UDP packets.
 */
export function proxyUdpToTcp(udpPort: number, options?: proxyUdpToTcpOptions) {
  const tcpServer = net.createServer();
  tcpServer.on("error", err => console.error(err));
  tcpServer.on("connection", socket => {
    const udpClient = dgram.createSocket(options?.udpType||"udp4");

    // Close Sockets
    udpClient.once("close", () => socket.end());
    socket.once("close", () => udpClient.close());

    // Print error
    udpClient.on("error", console.error);
    socket.on("error", console.error);

    // Pipe Datas
    udpClient.on("message", data => socket.write(data));
    socket.on("data", data => udpClient.send(data));

    // Connect
    udpClient.connect(udpPort);
  });

  // Listen
  tcpServer.listen(options?.listen||0, function() {
    const addr = this.address();
    if (options?.portListen) options.portListen(addr.port);
    console.debug("bds proxy port listen, %s, (udp -> tcp)", addr.port);
    tcpServer.once("close", () => console.debug("bds proxy close, %s", addr.port));
  });

  return tcpServer;
}

export function proxyTcpToUdp(options: proxyTcpToUdpClient) {
  const sessions: {[keyIP: string]: net.Socket} = {};
  const udp = dgram.createSocket(options?.udpType||"udp4");

  udp.on("error", console.error);
  udp.on("message", (msg, ipInfo) => {
    const keyInfo = `${ipInfo.address}:${ipInfo.port}`;

    // Client TCP
    if (!sessions[keyInfo]) {
      sessions[keyInfo] = net.createConnection(options.remote);
      sessions[keyInfo].on("data", data => udp.send(data, ipInfo.port, ipInfo.address));
      sessions[keyInfo].on("error", console.error);
      sessions[keyInfo].once("close", () => {
        delete sessions[keyInfo];
        console.log("Client %s:%f close", ipInfo.address, ipInfo.port);
      });
      console.log("Client %s:%f connected", ipInfo.address, ipInfo.port);
    }

    // Send message
    sessions[keyInfo].write(msg);
  });

  // Listen port
  udp.bind(options.listen||0, function(){
    const addr = this.address();
    console.log("Port listen, %s (tcp -> udp)", addr.port);
  });
}