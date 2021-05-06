#!/usr/bin/env node
const commandExist = require("./commandExist")
const kernel = require("./DetectKernel")()

if (process.platform === "linux") {
    if (!(commandExist("curl") || commandExist("wget"))) throw Error("Linux Users: https://docs.the-bds-maneger.org/docs/Bds Maneger core/CurlWget/#linux")
}
else if (process.platform === "android") {
    if (!(commandExist("curl") || commandExist("wget"))) throw Error("Linux Users: https://docs.the-bds-maneger.org/docs/Bds Maneger core/CurlWget/#linux")
}
else if (process.platform === "darwin") {
    if (!(commandExist("curl") || commandExist("wget"))) throw Error("https://docs.the-bds-maneger.org/docs/Bds Maneger core/CurlWget/#macos")
}
else if (process.platform === "win32") {
    if (!(commandExist("curl.exe"))) {
        if (kernel === "Windows 10 NT") throw Error("Windows 10 User: https://docs.the-bds-maneger.org/docs/Bds Maneger core/CurlWget/#windows-10");
        else throw Error ("Windows Versions: https://docs.the-bds-maneger.org/docs/Bds Maneger core/CurlWget/#windows-7-8-81-and-10-before-1709")
    }
}
else throw Error("Please install curl manually, download page: https://curl.se/download.html")
