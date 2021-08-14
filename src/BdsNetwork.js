// External User ip
const fetchSync = require("@the-bds-maneger/fetchsync");
const os = require("os");
const { GetTempHost } = require("../lib/BdsSettings");

const externalIP = {
    ipv4: fetchSync("https://api.ipify.org/").text().replace("\n", ""),
    ipv6: fetchSync("https://api64.ipify.org/").text().replace("\n", "")
}

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

// Temp Host
var host = null,
    HostResponse = null;

if (GetTempHost()){
    // Get HOST
    HostResponse = fetchSync("https://bds-core-back-end.vercel.app/Gethost", {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({
            mac: Interfaces[0].MAC,
            ip: external_ip.ipv4,
        }),
        headers: {
            "Content-Type": "application/json"
        }
    }).json();
    global.BdsTempHost = HostResponse.user.host.host
    host = HostResponse.user.host.host

    console.log(`Bds Maneger Core Temp Host ID: ${HostResponse.user.ID}`)

    // Delete Host
    process.on("exit", function () {
        const deleted_host = fetchSync("https://bds-core-back-end.vercel.app/DeleteHost", {
            method: "post",
            body: JSON.stringify({
                "ID": HostResponse.user.ID
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).json()
        if (deleted_host.error) console.log(deleted_host.error)
    })
} else module.exports.host = null

module.exports = {
    externalIP,
    ip: externalIP,
    internal_ip,
    Interfaces,
    HostResponse,
    host,
}