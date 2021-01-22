module.exports.World_BAckup = () => {
    if (require("./detect_bds").bds_detect()){require("../global/stop").Server_stop()}
    const bds = require('../index')
    if (process.platform == "win32") {
        var today = bds.date()
        var name = `${process.env.USERPROFILE}/Desktop/bds_backup_World_${today}.zip`
        var dir_zip = `${require("../index").bds_dir}/worlds/`
    } else if (process.platform == "linux") {
        var today = bds.date()
        var name = `${process.env.HOME}/bds_backup_World_${today}.zip`
        var dir_zip = `${require("../index").bds_dir_java}/world/`
    };
    var AdmZip = require("adm-zip");var zip = new AdmZip();zip.addLocalFolder(dir_zip);zip.addZipComment(`Backup zip file in ${today}. \nBackup made to ${process.platform}, Free and open content for all\n\nSirherobrine23© By Bds Maneger.`);var zipEntries = zip.getEntries();zipEntries.forEach(function (zipEntry) {console.log(zipEntry.entryName.toString());});zip.writeZip(name);console.log("Backup Sucess")
};

module.exports.Drive_backup = () => {
    if (require("./detect_bds").bds_detect()){require("../global/stop").Server_stop()}
    const bds = require("../index");
    const path = require("path");
    var dir_zip = path.join(bds.bds_dir_java, "world");
    const today = bds.date();
    const file_name = `bds_backup_World_${today}.zip`
    const name = path.join(bds.tmp_dir, file_name)
    /* Compress the folders */
    var AdmZip = require("adm-zip");var zip = new AdmZip();zip.addLocalFolder(dir_zip);zip.addZipComment(`Backup zip file in ${today}. \nBackup made to ${process.platform}, Free and open content for all\n\nSirherobrine23© By Bds Maneger.`);var zipEntries = zip.getEntries();zip.writeZip(name);console.log("Backup Sucess")
    var json_return = {
        file_dir: name.replaceAll("\\", "/"),
        file_name: file_name
    }
    return json_return
};

