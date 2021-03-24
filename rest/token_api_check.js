module.exports = (token) => {
    const fs = require("fs")
    const path = require("path")
    const bds = require("../index")
    const path_tokens = path.join(bds.bds_dir, "bds_tokens.json")
    if (fs.existsSync(path_tokens)) var tokens = JSON.parse(fs.readFileSync(path_tokens, "utf8"))
    else return false

    for (let token_verify in tokens) {
        const element = tokens[token_verify].token
        if (element === token) return true
        else token_verify++
    }
    return false
}

