const FetchSync = require("../fetchSync");
module.exports.external_ip = module.exports.ip = FetchSync("https://ipecho.net/plain").text()

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