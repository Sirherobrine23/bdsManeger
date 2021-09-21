const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const cli_color = require("cli-color");

// Fetch
if (typeof fetch === "undefined") global.fetch = require("node-fetch");

fetch("https://registry.npmjs.org/@the-bds-maneger/core").then(res => res.json()).then(data => {
    data.versions = Object.getOwnPropertyNames(data.versions).filter(version => /[0-9]+\.[0-9][0-9][0-9]/.test(version) && version !== data["dist-tags"].dev && version !== data["dist-tags"].latest)
    fs.writeFileSync(path.resolve(__dirname, "Releases.json"), JSON.stringify(data, null, 2));
    const Package = require("../package.json");
    data.versions.map(version => {
        const cmd = `npm unpublish ${Package.name}@${version}`;
        console.log(cli_color.yellow(cmd));
        try {
            child_process.execSync(cmd).toString()
            console.log(cli_color.green(`Sucess to remove ${Package.name}@${version}`, "\n"));
            return cmd;
        } catch (e) {
            console.log(cli_color.red(`Failed to remove package: ${Package.name}@${version}`), "\n");
            return version;
        }
    });
    fs.writeFileSync(path.resolve(__dirname, "Releases.json"), JSON.stringify(data, null, 2));
});