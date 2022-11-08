import type { HTTPError } from "got";
import { httpRequest } from "@the-bds-maneger/core-utils";
import { format } from "node:util";
import crypto from "node:crypto";
import dgram from "node:dgram";
import net from "node:net";

export type playitAgentAccountStatus = {type: "agent-account-status", status: "verified-account", account_id: number};
export type agentConfig = {
  type: "agent-config",
  last_update: number,
  ping_targets: string[],
  ping_target_addresses: string[],
  control_address: string,
  refresh_from_api: true,
  secret_key: string,
  mappings: []
};

export type playitTunnelAuth = {
  type: "signed-tunnel-request",
  auth: {
    details: {
      account_id: number,
      request_timestamp: number,
      session_id: number
    },
    signature: {
      System: {
        signature: number[]
      }
    }
  },
  content: number[]
}

export type playitTunnelOptions = {secretKey: string, apiUrl?: string, controlAddress?: string, clientVersion?: string};
export async function playitTunnel(options: playitTunnelOptions) {
  options = {apiUrl: "api.playit.cloud", controlAddress: "control.playit.gg", clientVersion: "0.2.3", ...options};
  if (!options.secretKey) throw new Error("Required secret key to auth in playit.gg");
  const Authorization = format("agent-key %s", options.secretKey);
  const accountInfo = await httpRequest.getJSON<playitAgentAccountStatus>({url: format("https://%s/agent", options.apiUrl), method: "POST", headers: {Authorization}, body: {type: "get-agent-account-status", client_version: options.clientVersion}}).catch((err: HTTPError) => {
    if (err.response.statusCode === 400) throw new Error("Secret key is invalid or not registred");
    throw err;
  });
  if (accountInfo.status !== "verified-account") throw new Error("Verify account fist");
  const agentInfo = await httpRequest.getJSON<agentConfig>({url: format("https://%s/agent", options.apiUrl), method: "POST", headers: {Authorization}, body: {type: "get-agent-config", client_version: options.clientVersion}});
  const signTunnel = await httpRequest.getJSON<playitTunnelAuth>({url: format("https://%s/agent", options.apiUrl), method: "POST", headers: {Authorization}, body: { type: "sign-tunnel-request", RegisterAgent: null }}).catch(err => err.response?.body?.toString()||err);

  return {agentInfo, signTunnel};
}

export type agentSecret = {type: "agent-secret", secret_key: string};

/**
 * Create a key to asynchronously authenticate playit.gg clients
 */
export async function playitClaimUrl(clainUrlCallback?: (url: string) => void) {
  const claimCode = crypto.pseudoRandomBytes(5).toString("hex");
  const url = format("https://playit.gg/claim/%s?type=%s&name=%s", claimCode, "bdscore_agent", `bdscore_agent`);
  if (clainUrlCallback) clainUrlCallback(url); else console.log("Playit claim url: %s", url);

  // Register to API
  let waitAuth = 0;
  let authAttempts = 0;
  async function getSecret(): Promise<agentSecret> {
    return httpRequest.getJSON({url: "https://api.playit.cloud/agent", method: "POST", headers: {}, body: {type: "exchange-claim-for-secret", claim_key: claimCode}}).catch(async (err: HTTPError) => {
      if (err?.response?.statusCode === 404||err?.response?.statusCode === 401) {
        if (err.response.statusCode === 404) if (authAttempts++ > 225) throw new Error("client not open auth url");
        if (err.response.statusCode === 401) if (waitAuth++ > 16) throw new Error("Claim code not authorized per client");
        await new Promise(resolve => setTimeout(resolve, 500));
        return getSecret();
      }
      throw err;
    });
  }

  return (await getSecret()).secret_key;
}

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
