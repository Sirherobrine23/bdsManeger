const { existsSync, mkdirSync, writeFileSync, chmodSync } = require("fs")
const { resolve, join } = require("path")
const binFolder = resolve((process.env.USERPROFILE||process.env.HOME), "bds_core", "bin")

if (typeof fetch === "undefined") {var fetch = require("node-fetch")}
(function (){
    if (require("command-exists").sync("curl")) {console.log("Curl is already installed.");process.exit(0)}
    else {
        if (!(existsSync(binFolder))) mkdirSync(binFolder)
        if (process.platform === "linux"){
            fetch("https://api.github.com/repos/moparisthebest/static-curl/releases").then(response => response.json()).then(function (res){
                var arch = process.arch
                if (arch === "x64") arch = "amd64"
                let url = `https://github.com/moparisthebest/static-curl/releases/download/${res[0].tag_name}/curl-${arch}`
                console.log(url);
                fetch(url).then(response => response.arrayBuffer()).then(response => Buffer.from(response)).then(response => {
                    writeFileSync(join(binFolder, "curl"), response, "binary")
                    chmodSync(join(binFolder, "curl"), 7777)
                    process.exit(0)
                }).catch(function (err){if (err) {console.log(err);process.exit(1)}})
            })
        } else if (process.platform === "darwin") throw Error("You will have to install cURL manually, download page: https://curl.se/download.html");
        else if (process.platform === "win32") {
            if (Math.trunc(require("os").release()) === "10") throw Error("Please make sure you are on the latest version of Windows 10");
            else throw Error(`Please manually install curl for Windows ${Math.trunc(require("os").release())}, download page: https://curl.se/download.html`)
        } else throw Error("Please install curl manually, download page: https://curl.se/download.html")
    }
})()