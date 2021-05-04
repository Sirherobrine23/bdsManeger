#!/usr/bin/env node
const commandExist = require("./commandExist")

if (process.platform === "linux" || process.platform === "android") {
    if (!(commandExist("curl") || commandExist("wget"))) throw Error("Linux Users: https://github.com/The-Bds-Maneger/core/wiki/Curl-Command#linux")
}
else if (process.platform === "darwin") {
    if (!(commandExist("curl") || commandExist("wget"))) throw Error("https://github.com/The-Bds-Maneger/core/wiki/Curl-Command#macos")
}
else if (process.platform === "win32") {
    if (!(commandExist("curl.exe"))) throw Error("Windows 10 User: https://github.com/The-Bds-Maneger/core/wiki/Curl-Command#windows-10 ,Other Windows Versions: https://github.com/The-Bds-Maneger/core/wiki/Curl-Command#windows-7-8-81")
}
else throw Error("Please install curl manually, download page: https://curl.se/download.html")
