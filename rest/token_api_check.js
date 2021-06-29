module.exports = (token) => {
    const fs = require("fs")
    const path = require("path")
    const { bds_dir } = require("../lib/BdsSettings")
    const path_tokens = path.join(bds_dir, "bds_tokens.json")
    if (fs.existsSync(path_tokens)) var tokens = JSON.parse(fs.readFileSync(path_tokens, "utf8")); else return false
    for (let token_verify of tokens) {
        const element = token_verify.token
        if (element === token) return true
    }
    return false
}

