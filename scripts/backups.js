module.exports.World_BAckup = () => {
    const bds = require("../index")
    const path = require("path")
    const java_pro = require("properties-to-json")
    const fs = require("fs")
    var AdmZip = require("adm-zip");

    var today = bds.date()
    const name = path.join(bds.backup_folder ,`bds_backup_World_${today}.zip`)
    var dir_zip;
    if (bds.platform === "bedrock"){
        dir_zip = path.join(bds.bds_dir_bedrock, "worlds") //`${require("../index").}/worlds/`
    } else {
        let file_ = JSON.stringify(java_pro(fs.readFileSync(path.join(bds.bds_dir_java, "server.properties"), "utf8").replaceAll("-", "_")))
        let world_name = JSON.parse(file_).level_name
        dir_zip = path.join(bds.bds_dir_java, world_name) //`${require("../index").bds_dir_bedrock}/${world_name}/`
    }
    /**
     * Before we can start it is good for the server not to have a Corrupted Backup
     * this is only necessary once after the server has started manually
    */
    if (bds.bds_detect()){bds.stop()}
    var zip = new AdmZip();
    zip.addLocalFolder(dir_zip);
    zip.addZipComment(`Backup zip file in ${today}. \nBackup made to ${process.platform}, Free and open content for all\n\nSirherobrine23© By Bds Maneger.`);
    var zipEntries = zip.getEntries();
    zipEntries.forEach(function (zipEntry) {
        console.log(zipEntry.entryName.toString());
    });
    zip.writeZip(name);
    return {
        path: name,
        world_path: dir_zip
    }
};

module.exports.Drive_backup = () => {
    const bds = require("../index")
    const path = require("path")
    const java_pro = require("properties-to-json")
    const fs = require("fs")
    var AdmZip = require("adm-zip");

    var today = bds.date()
    const name = path.join(bds.backup_folder ,`bds_backup_World_${today}.zip`)
    var dir_zip;
    if (bds.platform === "bedrock"){
        dir_zip = path.join(bds.bds_dir_bedrock, "worlds") //`${require("../index").}/worlds/`
    } else {
        let file_ = JSON.stringify(java_pro(fs.readFileSync(path.join(bds.bds_dir_java, "server.properties"), "utf8").replaceAll("-", "_"))).split("true").join(true).toString().split("false").join(false).toString()
        let world_name = JSON.parse(file_).level_name
        dir_zip = path.join(bds.bds_dir_java, world_name) //`${require("../index").bds_dir_bedrock}/${world_name}/`
    }
    /**
     * Before we can start it is good for the server not to have a Corrupted Backup
     * this is only necessary once after the server has started manually
    */
    const js_ = {
        "file_path": name,
        "file_name": `bds_backup_World_${today}.zip`,
        "id": undefined
    }
    console.info("Please wait")
    if (bds.bds_detect()){bds.stop()}
    var zip = new AdmZip();
    zip.addLocalFolder(dir_zip);
    zip.addZipComment(`Backup zip file in ${today}. \nBackup made to ${process.platform}, Free and open content for all\n\nSirherobrine23© By Bds Maneger.`);
    zip.writeZip(name);
    return js_
};

