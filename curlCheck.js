const commandExist = require("command-exists").sync
if (commandExist("curl")) {console.log("Curl is already installed.");process.exit(0)}
else {
    if (process.platform === "linux") throw Error("Linux Users: https://github.com/The-Bds-Maneger/core/wiki/Curl-Command#linux")
    else if (process.platform === "darwin") throw Error("https://github.com/The-Bds-Maneger/core/wiki/Curl-Command#macos");
    else if (process.platform === "win32") throw Error("Windows 10 User: https://github.com/The-Bds-Maneger/core/wiki/Curl-Command#windows-10 ,Other Windows Versions: https://github.com/The-Bds-Maneger/core/wiki/Curl-Command#windows-7-8-81")
    else throw Error("Please install curl manually, download page: https://curl.se/download.html")
}