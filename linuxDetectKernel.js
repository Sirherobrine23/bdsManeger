const { execSync } = require("child_process");
const commadExist = require("./commandExist")
function kerneldetect() {
    if (!commadExist("uname")) throw new Error("uname command no exist");
    const str = execSync("uname -r").toString("ascii");
    switch (true) {
        case /aws/.test(str):
            return "aws";

        case /microsoft/.test(str):
        case /Microsoft/.test(str):
            return "microsoft";

        case /Azure/.test(str):
        case /azure/.test(str):
            return "azure";

        case /gcp/.test(str):
        case /Gcp/.test(str):
            return "google cloud platform";

        case /oracle/.test(str):
        case /Oracle/.test(str):
            return "oracle";

        case /Generic/.test(str):
        case /generic/.test(str):
            return "generic";

        default:
            return str;

    }
}
module.exports = kerneldetect;