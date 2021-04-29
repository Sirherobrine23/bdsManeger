const { execSync, exec } = require("child_process")
const commandExists = require("command-exists").sync
const { resolve } = require("path")
const { getConfigHome } = require("./GetPlatformFolder")

if (!(commandExists("git"))) throw new Error("Install git")

//-----------------------------------------------------------
function cloneSync(url, path, depth) {
    const urlSplit = url.split("/")
    if (path === undefined) path = resolve(getConfigHome(), urlSplit[urlSplit.length - 2], urlSplit[urlSplit.length - 1].replace(".git", ""))
    if (depth !== undefined) depth = `--depth ${depth}`;else depth = ""
    const command = `git clone "${url}" ${depth} ${resolve(path)}`.split(/\s+/g).join(" ");
    return execSync(command).toString("ascii")
}

function clone(url, path, depth, more) {
    const urlSplit = url.split("/")
    if (more === undefined) more = ""
    if (path === undefined) path = resolve(getConfigHome(), urlSplit[urlSplit.length - 2], urlSplit[urlSplit.length - 1].replace(".git", ""))
    if (depth !== undefined) depth = `--depth ${depth}`;else depth = ""
    const command = `git clone "${url}" ${depth} ${more} ${resolve(path)}`.split(/\s+/g).join(" ");
    console.log(command);
    const run = exec(command)
    return {
        "stdout": run.stdout,
        "stderr": run.stderr
    }
}

function fetchSync(path){
    if (path === undefined) throw new Error("The path was not informed to fetch git !!")
    const fetch = resolve("git fetch", {
        cwd: resolve(path)
    })
    return fetch.toString("ascii")
}

function fetch(path){
    if (path === undefined) throw new Error("The path was not informed to fetch git !!")
    const fetch = exec("git fetch", {
        cwd: resolve(path)
    })
    return {
        "stdout": fetch.stdout,
        "stderr": fetch.stderr
    }
}

function pullSync(path){
    if (path === undefined) throw new Error("We cannot pull, path was not informed")
    const fetch = resolve("git pull --recurse-submodules=on-demand", {
        cwd: resolve(path)
    })
    return fetch.toString("ascii")
}

function pull(path, options){
    if (path === undefined) throw new Error("We cannot pull, path was not informed")
    const fetch = exec(`git pull --recurse-submodules=on-demand ${options || ""}`, {
        cwd: resolve(path)
    })
    return {
        "stdout": fetch.stdout,
        "stderr": fetch.stderr
    }
}

module.exports = {
    cloneSync,
    clone,
    fetchSync,
    fetch,
    pull,
    pullSync
}