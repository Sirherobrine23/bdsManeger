function backup_world() {
    const bds = require("../index")
    const path = require("path")
    const { join } = require("path");
    const {readdirSync} = require("fs")
    var AdmZip = require("adm-zip");
    const today = bds.date()
    const name = path.join(bds.backup_folder ,`bds_backup_Worlds_${today}_${bds.platform}.zip`);
    console.info("Please wait")
    const zip = new AdmZip();
    if (process.env.BDS_DOCKER_IMAGE !== "true") if (bds.bds_detect()) bds.stop();
    if (bds.platform === "bedrock") zip.addLocalFolder(path.join(bds.bds_dir_bedrock, "worlds"));
    else if (bds.platform === "java") {
        var javaDir = readdirSync(bds.bds_dir_java);
        javaDir = javaDir.filter(function(value) {
            if (value === "banned-ips.json") return false
            if (value === "banned-players.json") return false
            if (value === "eula.txt") return false
            if (value === "logs") return false
            if (value === "ops.json") return false
            if (value === "server.jar") return false
            if (value === "server.properties") return false
            if (value === "usercache.json") return false
            if (value === "whitelist.json") return false
            return true
        });
        for (let index of javaDir) zip.addLocalFolder(join(bds.bds_dir_java, index))
    }
    else if (bds.platform === "pocketmine") throw Error("PocketMinenot Have Backkup only")
    else throw Error("")
    zip.addZipComment("Worlds backup, by The Bds Maneger Project©");
    zip.writeZip(name);
    return {
        "file_path": name,
        "file_name": `Minecraft-${bds.platform}_World-Backup_${today}.zip`
    }
}


module.exports.World_BAckup = backup_world
module.exports.Drive_backup = backup_world
