const { execSync } = require("child_process")
const commandExists = require("../lib/commandExist").sync
const { existsSync } = require("fs");
const { resolve } = require("path")
const { getConfigHome } = require("./GetPlatformFolder")

if (!(commandExists("git"))) throw new Error("Install git")

//-----------------------------------------------------------
function cloneSync(url, path, depth) {
    // Check exist dir
    if (existsSync(path)) return pullSync(path)
    else {
        // const command = `git clone "${url}" ${depth} ${resolve(path)}`.split(/\s+/g).join(" ");
        const argv = ["clone", `"${url}"`]
        
        // Path clone
        const urlSplit = url.split("/")
        if (!(path)) path = resolve(process.cwd(), urlSplit[urlSplit.length - 2], urlSplit[urlSplit.length - 1].replace(".git", ""))
        
        // Run Clone
        if (typeof depth === "number") argv.push(`--depth ${depth}`);
        argv.push(path);
        return execSync("git", argv).toString("ascii")
    }
}

function fetchSync(path = "./"){
    const fetch = resolve("git fetch", {
        cwd: resolve(path)
    })
    return fetch.toString("ascii")
}

function pullSync(path = "./"){
    const fetch = resolve("git pull --recurse-submodules=on-demand", {
        cwd: resolve(path)
    })
    return fetch.toString("ascii")
}
module.exports = {
    cloneSync,
    fetchSync,
    pullSync
}
