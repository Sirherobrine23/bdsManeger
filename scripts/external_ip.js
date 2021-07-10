// External User ip
const fetchSync = require("@the-bds-maneger/fetchsync");
const externalIP = {
    ipv4: fetchSync("https://api.ipify.org/").text(),
    ipv6: fetchSync("https://api64.ipify.org/").text()
}
module.exports.external_ip = externalIP
module.exports.ip = externalIP

// Internal ip user
const interfaces = require("os").networkInterfaces();
const internal_ip = []
for (let index of Object.getOwnPropertyNames(require("os").networkInterfaces())){
    const inter = interfaces[index]
    for (let ind in inter){
        if (inter[ind].address.includes("::")) internal_ip.push(`[${inter[ind].address}]`)
        else internal_ip.push(inter[ind].address)
    }
}
module.exports.internal_ip = internal_ip