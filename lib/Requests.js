// Load Fetch.js
const fetchS = (...args) => import("node-fetch").then(mod => mod.default(...args));

// Set global fetch
if (typeof fetch === "undefined") global.fetch = fetchS;

// Request Json
const ReqJson = async (url = "", options) => await (await fetch(url, options)).json()

// Request Text
const ReqText = async (url = "", options) => `${await (await fetch(url, options)).text()}`

const ReqBuffer = async (url = "", options) => Buffer.from(await (await fetch(url, options)).arrayBuffer())

// Export Bds Request
module.exports = {
    // JSON
    JSON: ReqJson,
    json: ReqJson,

    // Raw Text
    TEXT: ReqText,
    text: ReqText,
    
    // Buffer
    BUFFER: ReqBuffer,
    buffer: ReqBuffer
}
