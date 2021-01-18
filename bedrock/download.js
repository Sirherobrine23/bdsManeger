module.exports = (Vdown) => {
    console.warn("Do not exit BDS Manager")
    const bds = require('../index')
    fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json").then(response => response.json()).then(versions => {
        console.log(Vdown, config)
        const mine = config.minecraft

        const system = bds.system
        var mine_name = `bedrock.zip`
        var server_DIR = bds.bds_dir_bedrock;
        if (system === 'linux')
            var versions_get = versions.bedrock[Vdown].url_linux;
        else
            var versions_get = versions.bedrock[Vdown].url_windows;

        console.log("Starting download")
        const exec = require("child_process").exec
        localStorage.setItem("bds_server_version", Vdown);        
        var downloadBDSchild = exec(`curl ${versions_get} --output ${mine_name}`, {
            cwd: `${bds.tmp_dir}`
        });
        var ZIP_FILE_PATH = `${bds.bds_dir}/${mine_name}`;
        downloadBDSchild.stdout.on("data", function(data){
            console.log(data)
        })
        downloadBDSchild.on("exit", function (code) {
            if (code === 0) {
                console.log(`Download zip file success`);

                var AdmZip = require("adm-zip");
                const fs = require("fs")
                if (fs.existsSync(`${server_DIR}/server.properties`)){var _old = true;var old1 = fs.readFileSync(`${server_DIR}/server.properties`, "utf-8");}
                if (fs.existsSync(`${server_DIR}/permissions.json`)){var _old2 = true;var old2 = fs.readFileSync(`${server_DIR}/permissions.json`, "utf-8");}
                if (fs.existsSync(`${server_DIR}/whitelist.json`)) {var _old3 = true;var old3 = fs.readFileSync(`${server_DIR}/whitelist.json`, "utf-8");}
                if (fs.existsSync(`${server_DIR}/valid_known_packs.json`)){var _old4 = true;var old4 = fs.readFileSync(`${server_DIR}/valid_known_packs.json`, "utf-8");};
                // Unzip 
                var ZIP_FILE_OUTPUT = `${server_DIR}`;var zip = new AdmZip(ZIP_FILE_PATH);
                zip.extractAllTo(ZIP_FILE_OUTPUT, true);
                // Unzip 
                if (_old){fs.writeFileSync(`${server_DIR}/server.properties`, old1);}
                if (_old2){fs.writeFileSync(`${server_DIR}/permissions.json`, old2);}
                if (_old3){fs.writeFileSync(`${server_DIR}/whitelist.json`, old3);}
                if (_old4){fs.writeFileSync(`${server_DIR}/valid_known_packs.json`, old4);};

                console.log("Downlod Sucess"); // End Unzip
                localStorage.setItem("Downlaod_sucess", "yes")
            } else {
                localStorage.setItem("Download_sucess", "no")
                throw new error(`Could not download`);
            }
        })
    })
}