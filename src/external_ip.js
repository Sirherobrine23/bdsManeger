// External User ip
const fetchSync = require("@the-bds-maneger/fetchsync");
const os = require("os")
const externalIP = {
    ipv4: fetchSync("https://api.ipify.org/").text().replace("\n", ""),
    ipv6: fetchSync("https://api64.ipify.org/").text().replace("\n", "")
}
module.exports.external_ip = externalIP
module.exports.ip = externalIP

// Internal ip user
const interfaces = os.networkInterfaces();
const internal_ip = []
for (let index of Object.getOwnPropertyNames(require("os").networkInterfaces())){
    const inter = interfaces[index]
    for (let ind in inter){
        if (inter[ind].address.includes("::")) internal_ip.push(`[${inter[ind].address}]`)
        else internal_ip.push(inter[ind].address)
    }
}
module.exports.internal_ip = internal_ip

// Network Interfaces
const a = os.networkInterfaces();
module.exports.Interfaces = Object.getOwnPropertyNames(a).map(inter => {
    inter = a[inter]
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
}).filter(a=>a)