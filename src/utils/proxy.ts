import type { HTTPError } from "got";
import { httpRequest } from "@the-bds-maneger/core-utils";
import { format } from "node:util";
import crypto from "node:crypto";
// import dgram from "node:dgram";
import net from "node:net";

export type agentSecret = {type: "agent-secret", secret_key: string};
export type playitTunnelOptions = {secretKey: string, apiUrl?: string, controlAddress?: string, clientVersion?: string};
export type tunnelList = {
  type: "account-tunnels",
  agent_id: string,
  tunnels: {
    id: string,
    enabled: boolean,
    name?: string,
    ip_address: string,
    ip_hostname: string,
    custom_domain?: string,
    assigned_domain: string,
    display_address: string,
    is_dedicated_ip: boolean,
    from_port: number,
    to_port: number,
    tunnel_type: "minecraft-bedrock"|"minecraft-java",
    port_type: "udp"|"tcp"|"both",
    firewall_id?: string,
    protocol: {
      protocol: "to-agent",
      local_ip: string,
      local_port: number,
      agent_id: number
    }
  }[]
}
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


/**
 * Create a key to asynchronously authenticate playit.gg clients
 */
export async function playitClainSecret(clainUrlCallback?: (url: string) => void) {
  const claimCode = crypto.pseudoRandomBytes(5).toString("hex");
  const url = format("https://playit.gg/claim/%s?type=%s&name=%s", claimCode, "self-managed", `bdscore_agent`);
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


/**
 * Crie um tunnel para o minecraft bedrock ou minecraft java para que usuarios fora da rede possa se conectar no servidor
 */
export async function playitTunnel(options: playitTunnelOptions) {
  options = {apiUrl: "api.playit.cloud", controlAddress: "control.playit.gg", clientVersion: "0.2.3", ...options};
  if (!options.secretKey) throw new Error("Required secret key to auth in playit.gg");
  const Authorization = format("agent-key %s", options.secretKey);
  const playitApiUrls = {
    agent: format("https://%s/agent", options.apiUrl),
    account: format("https://%s/account", options.apiUrl)
  };
  const accountInfo = await httpRequest.getJSON<playitAgentAccountStatus>({url: playitApiUrls.agent, method: "POST", headers: {Authorization}, body: {type: "get-agent-account-status", client_version: options.clientVersion}}).catch((err: HTTPError) => {
    if (err.response.statusCode === 400) throw new Error("Secret key is invalid or not registred");
    throw err;
  });
  if (accountInfo.status !== "verified-account") throw new Error("Verify account fist");
  const agentInfo = await httpRequest.getJSON<agentConfig>({url: playitApiUrls.agent, method: "POST", headers: {Authorization}, body: {type: "get-agent-config", client_version: options.clientVersion}});
  const signTunnel = await httpRequest.getJSON<playitTunnelAuth>({url: playitApiUrls.agent, method: "POST", headers: {Authorization}, body: { type: "sign-tunnel-request", RegisterAgent: null }}).catch(err => err.response?.body?.toString()||err);

  async function listTunnels() {
    const data = await httpRequest.getJSON<tunnelList>({
      url: playitApiUrls.account,
      method: "POST",
      headers: {Authorization},
      body: {
        type: "list-account-tunnels"
      }
    }).catch(err => Promise.reject(JSON.parse(err.response?.body?.toString())));
    data.tunnels = data.tunnels.filter(tunnel => (["minecraft-bedrock", "minecraft-java"]).includes(tunnel.tunnel_type));
    return data;
  }

  async function createTunnel(options: {tunnel_for: "bedrock"|"java", name: string, local_ip: string, local_port: number}) {
    const agent_id = (await listTunnels()).agent_id;
    const tunnelCreated = await httpRequest.getJSON<{ type: "created", id: string }>({
      url: playitApiUrls.account,
      method: "POST",
      headers: {Authorization},
      body: {
        type: "create-tunnel", agent_id,
        name: options.name,
        tunnel_type: options.tunnel_for === "bedrock"?"minecraft-bedrock":"minecraft-java",
        port_type: options.tunnel_for === "bedrock"?"udp":"tcp",
        port_count: 1,
        local_ip: options.local_ip, local_port: options.local_port,
      }
    });
    return (await listTunnels()).tunnels.find(tunnel => tunnel.id === tunnelCreated.id);
  }

  async function connectTunnel(name?: string) {
    const tunnelInfo = (await listTunnels()).tunnels.find(tunnel => name?(tunnel.name === name||tunnel.id === name):true);
    if (!tunnelInfo) throw new Error("No tunnel selected");
    if (tunnelInfo.port_type !== "tcp") throw new Error("Current support only TCP tunnel");
  }

  return {agentInfo, signTunnel, listTunnels, createTunnel, connectTunnel};
}