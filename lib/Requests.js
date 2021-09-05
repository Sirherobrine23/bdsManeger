const axios = require("axios").default;
module.exports = {
    JSON: async (url = "", options) => await (await axios({url: url, ...options})),
    TEXT: async (url = "", options) => await (await axios({url: url, ...options})),
    BUFFER: async (url = "", options) => Buffer.from(await (await axios({url, ...options, responseType: "arraybuffer"}))),
}
