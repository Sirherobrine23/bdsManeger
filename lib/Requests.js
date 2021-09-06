const axios = require("axios").default;
module.exports = {
    JSON: async (url = "", options) => await (await axios({url: url, ...options})).data,
    TEXT: async (url = "", options) => await (await axios({url: url, ...options})).data,
    BUFFER: async (url = "", options) => Buffer.from((await axios({url: url, ...options, responseType: "arraybuffer"})).data)
}
