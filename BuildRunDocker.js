const { join } = require("path");
const fetch = require("node-fetch");
const { writeFileSync, rmSync } = require("fs");
const { exit } = require("process");

fetch("https://raw.githubusercontent.com/Sirherobrine23/MSQ-files/main/NodeJS Docker Build Run.js").then(res => {if (res.ok) return res.text();else throw new Error(res)}).then(res => {
    const fileExec = join(__dirname, "Docker.js");
    writeFileSync(fileExec, res);
    require(fileExec)(function (code){
        console.log(`Exit with code: ${code}`);
        rmSync(fileExec);
        exit(code);
    })
})