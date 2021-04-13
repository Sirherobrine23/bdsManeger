const { resolve, join } = require("path");
const { existsSync, readFileSync, mkdirSync } = require("fs");

function getAppDate(){
    if (process.platform === "win32") return resolve(process.env.USERPROFILE, "AppData", "Roaming");
    else if (process.platform === "darwin") return resolve(process.env.HOME, "Library", "Application Support");
    else if (process.platform === "linux") return resolve(process.env.HOME, ".local", "share");
}

function getDesktopFolder(){
    if (process.platform === "win32") return resolve(process.env.USERPROFILE, "Desktop");
    else if (process.platform === "darwin") return  resolve(process.env.HOME, "Desktop");
    else if (process.platform === "linux") {
        var desktop;
        var XDG_File = join(process.env.HOME, ".config", "user-dirs.dirs");
        if (existsSync(XDG_File)){
            const lines = readFileSync(XDG_File, "utf8").split(/\r?\n/g).filter((a) => !a.startsWith("#"));
            var data = {};
            for(let line of lines){
                const i = line.indexOf("=");
                if(i >= 0){
                    try {
                        data[line.substring(0,i)] = JSON.parse(line.substring(i + 1))
                    }
                    catch(e) {error(e)}
                }
            }
            if (data["XDG_DESKTOP_DIR"]){
                desktop = data["XDG_DESKTOP_DIR"];
                desktop = desktop.replace(/\$([A-Za-z\-_]+)|\$\{([^{^}]+)\}/g, process.env.HOME)
            }
        }
        // Check Desktop string
        if (desktop === undefined) {
            console.log("Using a temporary Desktop directory");
            desktop = resolve((process.env.TMPDIR||"/tmp"), "desktop", )
            if (!(existsSync(desktop))) mkdirSync(desktop)
        }
        return desktop
    }
}

module.exports = {
    getConfigHome: getAppDate,
    getAppDate: getAppDate,
    getDesktopFolder: getDesktopFolder
}