if (typeof fetch === "undefined") global.fetch = require("node-fetch");
module.exports = {
    JSON: async (url = "", options) => await (await fetch(url, options)).json(),
    TEXT: async (url = "", options) => await (await fetch(url, options)).text(),
    BUFFER: async (url = "", options) => Buffer.from(await (await fetch(url, options)).arrayBuffer()),
}