const { join } = require("path");
const https = require("https");
const { writeFileSync, rmSync, appendFileSync } = require("fs");
const { exit } = require("process");
if (process.platform !== "win32") process.env.TMP = "/tmp"
const ScriptUrl = "https://raw.githubusercontent.com/Sirherobrine23/MSQ-files/main/NodeJS Docker Build Run.js"
const fileExec = join(__dirname, "Docker.js");

https.get(ScriptUrl, (res) => {
    writeFileSync(fileExec, "")
    res.on("data", (d) => appendFileSync(fileExec, d))
    res.once("end", () => {
        require(fileExec)(function (code){
            console.log(`Exit with code: ${code}`);
            rmSync(fileExec);
            exit(code);
        })
    });
}).on("error", (e) => {
    console.error(e);
});
