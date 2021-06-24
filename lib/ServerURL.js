const fetchSync = require("./fetchSync");
module.exports = {
    Servers: fetchSync("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json").json(),
    PHPBin: fetchSync("https://raw.githubusercontent.com/The-Bds-Maneger/Raw_files/main/php_bin.json").json(),
    GoogleDriver: fetchSync("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/credentials.json").json()
}