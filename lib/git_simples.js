const { execSync, execFileSync } = require("child_process")
const commandExists = require("./commandExist").sync
const { existsSync } = require("fs");
const { resolve, join } = require("path")

if (!(commandExists("git"))) throw new Error("Install git")

//-----------------------------------------------------------
function GitClone(url, path = resolve(process.cwd(), Math.random().toString().replace(/[01]\./, "GitClone")), depth = 1) {
    // Check exist dir
    if (existsSync(join(path, ".git"))) return GitPull(path)
    else {
        // const command = `git clone "${url}" ${depth} ${resolve(path)}`
        if (typeof depth !== "number") depth = 1;
        console.log("git", ["clone", url, "--depth", depth, path]);
        execFileSync("git", ["clone", url, "--depth", depth, path]).toString("ascii")
        return execSync("git log -1 --pretty=format:%H", {cwd: path}).toString("ascii").split("\n").filter(d=>{if(d)return true;return false}).join("");
    }
}

/**
 * Pull changes from git repository and return git sha
 *
 * @param {string} [path="./"]
 * @return {string} git sha
 */
function GitPull(path = "./"){
    execSync("git pull --recurse-submodules=on-demand", {
        cwd: resolve(path)
    })
    return execSync("git log -1 --pretty=format:%H", {cwd: path}).toString("ascii").split("\n").filter(d=>{if(d)return true;return false}).join("");
}
module.exports = {
    GitClone,
    GitPull
}
