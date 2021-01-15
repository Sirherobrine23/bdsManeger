module.exports.DownloadBDS = (Vdown) => {
    console.warn("Do not exit BDS Manager")
    console.log("Starting download")
    const exec = require("child_process").exec
    if (require("../index").electron){
        localStorage.setItem("bds_server_version", Vdown);
    };
    var NAMEd = `bedrock-server-${Vdown}.zip`
    if (process.platform == "win32") {
        var URLd = `https://minecraft.azureedge.net/bin-win/bedrock-server-${Vdown}.zip`;
        var downloadBDSchild = exec(`cd %TMP% && curl ${URLd} --output ${NAMEd}`);
        var ZIP_FILE_PATH = `${process.env.TMP}/${NAMEd}`;
    } else if (process.platform == "linux") {
        var URLd = `https://minecraft.azureedge.net/bin-linux/bedrock-server-${Vdown}.zip`;
        var downloadBDSchild = exec(`cd /tmp && curl ${URLd} --output ${NAMEd}`);
        var ZIP_FILE_PATH = `/tmp/${NAMEd}`;
    }
    downloadBDSchild.on("exit", function (code) {
        if (code === 0) {
            const server_DIR = require("../index").server_dir;
            const fs = require("fs")
            if (fs.existsSync(`${server_DIR}/server.properties`)){
                var OLD_ = true
                var old1 = fs.readFileSync(`${server_DIR}/server.properties`, "utf-8");
            }
            if (fs.existsSync(`${server_DIR}/permissions.json`)){
                var _old2 = true
                var old2 = fs.readFileSync(`${server_DIR}/permissions.json`, "utf-8");
            }
            if (fs.existsSync(`${server_DIR}/whitelist.json`)) {
                var _old3 = true
                var old3 = fs.readFileSync(`${server_DIR}/whitelist.json`, "utf-8");
            }
            if (fs.existsSync(`${server_DIR}/valid_known_packs.json`)){
                var _old4 = true
                var old4 = fs.readFileSync(`${server_DIR}/valid_known_packs.json`, "utf-8");
            };
            console.log(`Download zip file success`)
            var ZIP_FILE_OUTPUT = `${server_DIR}`;
            var AdmZip = require("adm-zip");
            var zip = new AdmZip(ZIP_FILE_PATH);
            zip.extractAllTo(ZIP_FILE_OUTPUT, true);
            if (OLD_){
                fs.writeFileSync(`${server_DIR}/server.properties`, old1);
            }
            if (_old2){
                fs.writeFileSync(`${server_DIR}/permissions.json`, old2);
            }
            if (_old3){
                fs.writeFileSync(`${server_DIR}/whitelist.json`, old3);
            }
            if (_old4){
                fs.writeFileSync(`${server_DIR}/valid_known_packs.json`, old4);
            };
            console.log("extract Sucess"); // End Unzip
            localStorage.setItem("Downlaod_sucess", "yes")
        } else {
            localStorage.setItem("Download_sucess", "no")
            throw new error(`Could not download`);
        }
    });
};
