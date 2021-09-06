const fetchS = (...args) => import("node-fetch").then(mod => mod.default(...args));
if (typeof fetch === "undefined") global.fetch = fetchS;
module.exports = {
    JSON: async (url = "", options) => await (await fetchS(url, options)).json(),
    TEXT: async (url = "", options) => await (await fetchS(url, options)).text(),
    BUFFER: async (url = "", options) => Buffer.from(await (await fetchS(url, options)).arrayBuffer()),
}
