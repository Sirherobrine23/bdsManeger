const { execSync } = require("child_process");
const { readdirSync } = require("fs");
const commadExist = require("./commandExist")
const { release } = require("os")

function kerneldetect() {
    if (process.platform === "win32") {
        const kernelVersion = parseFloat(release());
        if (kernelVersion <= 6.1) return "Windows 7 NT";
        else if (kernelVersion <= 6.2) return "Windows 8 NT";
        else if (kernelVersion <= 6.3) return "Windows 8.1 NT";
        else if (kernelVersion <= 10.0) return "Windows 10 NT";
        else return "Other Windows NT";
    }
    else if (process.platform === "android") return `${release()}, CPU Core ${readdirSync("/sys/devices/system/cpu/").filter(data=>{return /cpu[0-9]/.test(data)}).length}`;
    else if (commadExist("uname")){
        const str = execSync("uname -r").toString("ascii");
        switch (true) {
            // amazon aws EC2
            case /aws/.test(str):
                if (process.arch === "arm64" || process.arch === "aarch64") return "Amazon AWS Cloud arm64: AWS Graviton";
                else return `Amazon AWS Cloud ${process.arch}: ${require("os").cpus()[0].model}`;

                // Windows WSL
            case /[mM]icrosoft/.test(str):
                return "Microsoft WSL";

            // Azure Virtual Machinime (VM)
            case /[aA]zure/.test(str):
                return "Microsoft Azure";

            // Google Cloud Virtual Machinime (VM)
            case /[gG]cp/.test(str):
                return "Google Cloud Platform";

            // Oracle cloud Virtual Machinime (VM)
            case /[oO]racle/.test(str):
                return "Oracle Cloud infrastructure";

            // Darwin
            case /darwin/.test(str):
                return "Apple MacOS";

            // Others Kernels
            case /[gG]eneric/.test(str):
            default:
                return `Generic Kernel ${process.arch}: ${require("os").cpus()[0].model}`;
        }
    } else return null;
}
module.exports = kerneldetect;