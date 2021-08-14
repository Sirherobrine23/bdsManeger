const fetchSync = require("@the-bds-maneger/fetchsync");
module.exports = {
    Servers: fetchSync("https://raw.githubusercontent.com/The-Bds-Maneger/external_files/main/Server.json").json(),
    PHPBin: fetchSync("https://raw.githubusercontent.com/The-Bds-Maneger/Php_Static_Binary/main/binarys.json").json()
}