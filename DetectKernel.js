const { execSync } = require("child_process");
const commadExist = require("./commandExist")
function kerneldetect() {
    if (process.platform === "win32") {
        const kernelVersion = parseFloat(require("os").release());
        if (kernelVersion <= 6.1) return "Windows 7 NT";
        else if (kernelVersion <= 6.2) return "Windows 8 NT";
        else if (kernelVersion <= 6.3) return "Windows 8.1 NT";
        else if (kernelVersion <= 10.0) return "Windows 10 NT";
        else return "Other Windows NT";
    } else if (commadExist("uname")){
        const str = execSync("uname -r").toString("ascii");
        switch (true) {
            // amazon aws EC2
            case /aws/.test(str):
                if (process.arch === "arm64" || process.arch === "aarch64") return "Amazon AWS Cloud arm64: AWS Graviton";
                else return `Amazon AWS Cloud ${process.arch}: ${require("os").cpus()[0].model}`;

                // Windows WSL
            case /microsoft/.test(str):
            case /Microsoft/.test(str):
                return "Microsoft WSL";

            // Azure Virtual Machinime (VM)
            case /Azure/.test(str):
            case /azure/.test(str):
                return "Microsoft Azure";

            // Google Cloud Virtual Machinime (VM)
            case /gcp/.test(str):
            case /Gcp/.test(str):
                return "Google Cloud Platform";

            // Oracle cloud Virtual Machinime (VM)
            case /oracle/.test(str):
            case /Oracle/.test(str):
                return "Oracle Cloud infrastructure";

            // Others Kernels
            case /Generic/.test(str):
            case /generic/.test(str):
            default:
                return `Generic Kernel ${process.arch}: ${require("os").cpus()[0].model}`;

        }
    } else return null;
}
module.exports = kerneldetect;