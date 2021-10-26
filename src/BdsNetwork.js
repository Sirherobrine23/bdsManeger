// External User ip
const Request = require("../lib/Requests");
const os = require("os");

function LocalInterfaces() {
  const interfaces = os.networkInterfaces();
  const localInterfaces = [];
  for (const name of Object.getOwnPropertyNames(interfaces)) {
    const Inter = {
      interfaceName: name,
      mac: "",
      v4: {
        addresses: "",
        netmask: "",
        cidr: ""
      },
      v6: {
        addresses: "",
        netmask: "",
        cidr: ""
      },
    }
    for (let iface of interfaces[name]) {
      if (!Inter.mac && iface.mac) Inter.mac = iface.mac;
      if (iface.family === "IPv4") {
        Inter.v4.addresses = iface.address;
        Inter.v4.netmask = iface.netmask;
        Inter.v4.cidr = iface.cidr;
      } else if (iface.family === "IPv6") {
        Inter.v6.addresses = iface.address;
        Inter.v6.netmask = iface.netmask;
        Inter.v6.cidr = iface.cidr;
      }
    }
    if (!(interfaces[name][0].internal)) localInterfaces.push(Inter);
  }
  return localInterfaces;
}

async function GetExternalPublicAddress() {
  const ExternlIPs = {
    ipv4: null,
    ipv6: null
  }
  ExternlIPs["ipv4"] = (await Request.TEXT("https://api.ipify.org")).replace("\n", "")
  ExternlIPs["ipv6"] = (await Request.TEXT("https://api64.ipify.org/")).replace("\n", "")
  if (ExternlIPs["ipv6"] === ExternlIPs["ipv4"]) ExternlIPs["ipv6"] = null;
  return ExternlIPs;
}

Request.TEXT("https://api.ipify.org").then(external_ipv4 => {
    Request.TEXT("https://api64.ipify.org/").then(external_ipv6 => {
        const externalIP = {
            ipv4: external_ipv4.replace("\n", ""),
            ipv6: external_ipv6.replace("\n", "")
        }

        module.exports.externalIP = externalIP;
        module.exports.ip = externalIP;
    });
});

// Internal ip user
const interfaces = os.networkInterfaces();
const internal_ip = [];
for (let inter of Object.getOwnPropertyNames(interfaces).map(index => interfaces[index])){
    for (let ind in inter){
        if (inter[ind].address.includes("::")) internal_ip.push(`[${inter[ind].address}]`)
        else internal_ip.push(inter[ind].address)
    }
}

// Network Interfaces
const Interfaces = Object.getOwnPropertyNames(interfaces).map(inter => {
    inter = interfaces[inter]
    if (inter[0].mac !== "00:00:00:00:00:00") {
        try {
            return {
                MAC: inter[0].mac,
                Interna_IP: {
                    ipv4: inter[0].address,
                    ipv6: inter[1].address,
                }
            }
        } catch (err) {
            return {
                MAC: inter[0].mac,
                Interna_IP: {
                    ipv4: inter[0].address,
                    ipv6: null,
                }
            }
        }
    }
}).filter(a=>a);

async function GetHost() {
  const MacAddr = LocalInterfaces().map(Int => Int.mac);
  const ExternalAddress = (await GetExternalPublicAddress()).ipv4;
  const RequestUpstream = await fetch(`https://upstream.bdsmaneger.com/v1/public_domain?MacAddress=${JSON.stringify(MacAddr)}&ExternalAdress=${ExternalAddress}`, {mode: "cors"});
  if (!RequestUpstream.ok) {
    throw {
      Backend: await RequestUpstream.json()
    }
  }
  const HostInfo = await RequestUpstream.json();
  const _toReturn = {
    host: "",
    UpstreamID: "",
    delete_host: async () => {
      const RequestDeleteHost = await fetch("https://upstream.bdsmaneger.com/v1/public_domain", {
        method: "DELETE",
        mode: "cors",
        body: JSON.stringify({
          UUID: HostInfo.ID
        })
      });
      return await RequestDeleteHost.json();
    }
  }
  _toReturn["host"] = HostInfo.host.host
  _toReturn["UpstreamID"] = HostInfo.ID
  return _toReturn;
}

module.exports = {
    internal_ip,
    Interfaces,
    LocalInterfaces,
    GetExternalPublicAddress,
    host: null,
    GetHost
}
