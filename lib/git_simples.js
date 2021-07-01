const { execSync } = require("child_process")
const commandExists = require("../lib/commandExist").sync
const { existsSync } = require("fs");
const { resolve } = require("path")

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
        execSync("git", argv).toString("ascii")
        return execSync("git log -1 --pretty=format:%H", {cwd: path}).toString("ascii").split("\n").filter(d=>{if(d)return true;return false}).join("");
    }
}

/**
 * Pull changes from git repository and return git sha
 *
 * @param {string} [path="./"]
 * @return {string} git sha
 */
function pullSync(path = "./"){
    const fetch = resolve("git pull --recurse-submodules=on-demand", {
        cwd: resolve(path)
    })
    fetch.toString("ascii")
    
    return execSync("git log -1 --pretty=format:%H", {cwd: path}).toString("ascii").split("\n").filter(d=>{if(d)return true;return false}).join("");
}
module.exports = {
    cloneSync,
    pullSync
}
