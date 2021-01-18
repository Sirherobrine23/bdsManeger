module.exports = (Vdown) => {
    console.warn("Do not exit BDS Manager")
    const bds = require('../index')
    fetch("https://raw.githubusercontent.com/Bds-Maneger/Raw_files/main/Server.json").then(response => response.json()).then(versions => {
        var versions_get = versions.java[Vdown].url
        var mine_name = `server.jar`

        console.log("Starting download")
        const exec = require("child_process").exec
        localStorage.setItem("bds_server_version", Vdown);        
        var downloadBDSchild = exec(`curl ${versions_get} --output ${mine_name}`, {
            cwd: `${bds.bds_dir_java}`
        });
        downloadBDSchild.stdout.on("data", function(data){
            console.log(data)
        })
        downloadBDSchild.on("exit", function (code) {
            if (code === 0) {
                console.log(`Download zip file success`);
                localStorage.setItem("Downlaod_sucess", "yes")
            } else {
                localStorage.setItem("Download_sucess", "no")
                throw new error(`Could not download`);
            }
        })
    })
}