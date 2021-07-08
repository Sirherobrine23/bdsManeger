const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const os = require("os");

const options = (function(){
    if (process.env.REQUEST_OPTIONS) return JSON.parse(process.env.REQUEST_OPTIONS)
    return {}
})()
const prefetch = fetch(process.env.URL_REQUEST, options)

// parse
if (process.env.TYPE_REQUEST === "true") prefetch.then(res=>res.arrayBuffer()).then(res => Buffer.from(res)).then(res => {
    const tmpfile = path.join(os.tmpdir(), Math.random().toString().replace(/[01]\./, "")+".BdsCoreTMP");fs.writeFileSync(tmpfile, res, "binary");
    console.log(`***tmpbdspath\n${tmpfile}`);
}); else prefetch.then(res=>res.text()).then(res => console.log(res))