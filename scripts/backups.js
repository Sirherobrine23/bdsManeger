var backup_world = function () {
    const bds = require("../index")
    const path = require("path")
    const java_pro = require("properties-to-json")
    const {readFileSync} = require("fs")
    var AdmZip = require("adm-zip");

    const today = bds.date()
    const name = path.join(bds.backup_folder ,`bds_backup_World_${today}.zip`)
    var dir_zip;
    if (bds.platform === "bedrock") dir_zip = path.join(bds.bds_dir_bedrock, "worlds")
    else dir_zip = path.join(bds.bds_dir_java, java_pro(readFileSync(path.join(bds.bds_dir_java, "server.properties"), "utf8").replaceAll("-", "_")).level_name)
    console.info("Please wait")
    if (process.env.BDS_DOCKER_IMAGE !== "true") if (bds.bds_detect()) bds.stop()
    var zip = new AdmZip();
    zip.addLocalFolder(dir_zip);
    zip.addZipComment("Backup Worlds, by The Bds Maneger Project©");
    zip.writeZip(name);
    return {
        "file_path": name,
        "file_name": `bds_backup_World_${today}.zip`
    }
};

module.exports.World_BAckup = backup_world
module.exports.Drive_backup = backup_world
