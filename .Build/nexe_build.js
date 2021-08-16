#!/usr/bin/env node

const { readdirSync, existsSync, mkdirSync, readFileSync, appendFileSync } = require("fs");
const { compile } = require("nexe");
const { homedir } = require("os");
const { resolve, join } = require("path");
const { getuid } = require("process");
const options = require("minimist")(process.argv.slice(2));

if (options.h || options.help) {
    const help = [
        "nexe_build [options]",
        "",
        "Options:",
	"   -v or --verbose",
        "   -o or --fileout         Bds Manager binary output location by default will be in the current folder",
        `   -S or --system          Install Bds Maneger globally for ${process.env.USERPROFILE || process.env.USER || "current user"}, if you have been on Linux you can install globally for all system users`,
    ]
    console.log(help.join("\n"))
    process.exit()
}

// FileOutput
var fileout = join(__dirname, "..", "BdsManager-bin");
if (process.platform !== "win32") fileout = join(__dirname, "..", "BdsManager-bin.bin");

if (options.fileout || options.O) fileout = (options.fileout || options.O);
if (options.system || options.S) {
    if (process.platform === "android") fileout = "/data/data/com.termux/files/usr/bin/bds_maneger";
    else if (process.platform === "win32") throw "We are still configuring for Windows, use this option on MacOS or linux distributions";
    else if (getuid() === 0) {
        console.log("Installing Bds Maneger cli globally");
        if (process.platform === "linux") fileout = "/bin/bds_maneger";
        else if (process.platform === "darwin") fileout = "/usr/local/bin/bds_maneger";
    } else {
        const binRoot = join(homedir(), ".bin") 
        if (!(existsSync(binRoot))) mkdirSync(binRoot, {recursive: true});
        
        // Shell
        var rcScript = join(homedir(), ".bashrc")
        if (process.env.SHELL.includes("zsh")) rcScript = join(homedir(), ".zshrc");

        // Path Bin
        if (!(readFileSync(rcScript, "utf8").toString().includes(binRoot))) appendFileSync(rcScript, `\n\n# Bds Maneger Bin Path\nexport PATH=$PATH:${binRoot}`);
        fileout = join(binRoot, "bds_maneger");
        
        // Info
        console.log(`Installing Bds Manager on ${binRoot}`);
    }
}

// nexe options
const nexeCopiler = {}
if (options.v || options.verbose)  nexeCopiler.loglevel = "verbose"
// Build Binarie
compile({
    name: "Bds Maneger Core",
    build: true,
    input: resolve(__dirname, "bds_maneger.js"),
    output: fileout,
    resources: readdirSync(resolve(__dirname, "..")).filter(retu => !/[Dd]ocker*.js|docker_config.json|*\.log/gi.test(retu)),
    ...nexeCopiler
}).then(() => process.exit(0)).catch(() => process.exit(1));
