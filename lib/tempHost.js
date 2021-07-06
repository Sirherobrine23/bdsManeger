const fetchSync = require("./fetchSync");
const external_ip = require("../scripts/external_ip").external_ip;
const { GetTempHost } = require("./BdsSettings")
const fetchUrl = `https://hosts.the-bds-maneger.org/GetTMPHost?ipv4=${external_ip.ipv4}&ipv6=${external_ip.ipv6}`;

if (GetTempHost()){
    const TMPHost = fetchSync(fetchUrl).text();
    console.log(`Your temp domain ${TMPHost}, it will be available until you close the project`);
    console.info("Only one domain is available for each person. do not abuse.")
    // export tmp url
    module.exports.tmphost = TMPHost
    process.on("exit", function () {
        console.log("Removing the temp domain");
        fetch("https://google.com.br").then(res => {
            if (!(res.ok)) console.info("We had a problem removing the temp domain, but it's already unizable")
        })
    })
} else module.exports.tmphost = null