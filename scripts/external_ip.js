const { execSync } = require("child_process");

if (typeof fetch === "undefined"){
    global.fetch = require("node-fetch")
}

module.exports.external_ip = module.exports.ip = execSync("curl -sS https://ipecho.net/plain").toString("ascii");

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