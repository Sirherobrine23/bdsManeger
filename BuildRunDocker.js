const { join } = require("path");
const fetch = require("node-fetch");
const { writeFileSync, rmSync } = require("fs");
const { exec } = require("child_process");
const { exit } = require("process");

fetch("https://raw.githubusercontent.com/Sirherobrine23/MSQ-files/main/NodeJS Docker Build Run.js").then(res => {if (res.ok) return res.text();else throw new Error(res)}).then(res => {
    const fileExec = join(__dirname, "Docker.js");
    writeFileSync(fileExec, res);
    require(fileExec)()
})