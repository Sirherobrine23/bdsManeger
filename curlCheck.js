const { existsSync, mkdirSync, writeFileSync, chmodSync } = require("fs")
const { resolve, join } = require("path")
const binFolder = resolve((process.env.USERPROFILE||process.env.HOME), "bds_core", "bin")

if (typeof fetch === "undefined") {global.fetch = require("node-fetch")}
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
            // Version                                    major.minor   
            // ------------------------------------------ ------------- 
            //  Windows 10, Windows Server 2016            10.0
            //  Windows 8.1, Windows Server 2012 R2        6.3
            //  Windows 8, Windows Server 2012             6.2
            //  Windows 7, Windows Server 2008 R2          6.1
            //  Windows Vista, Windows Server 2008         6.0
            //  Windows XP Professional x64 Edition,       5.2
            //  Windows Server 2003, Windows Home Server
            //  Windows XP                                 5.1
            //  Windows 2000                               5.0
            var WindowsVersion = require("os").release()
            if (WindowsVersion.includes("10.0")) WindowsVersion = 10
            else if (WindowsVersion.includes("6.3")) WindowsVersion = 8.1
            else if (WindowsVersion.includes("6.2")) WindowsVersion = 8
            else if (WindowsVersion.includes("6.1")) WindowsVersion = 7
            else WindowsVersion = "unsupported"

            if (WindowsVersion === 10) throw Error("Please make sure you are on the latest version of Windows 10");
            else throw Error(`Please manually install curl for Windows ${WindowsVersion}, download page: https://curl.se/download.html`)
        } else throw Error("Please install curl manually, download page: https://curl.se/download.html")
    }
})()