const bds = require("../index")
const path = require("path")
const { join } = require("path");
const {readdirSync, existsSync} = require("fs")
var AdmZip = require("adm-zip");

function backup_world() {
    const zip = new AdmZip();
    console.info("Please wait");
    // Names And Path"s
    const name = `Bds_Maneger-Backups_${bds.date()}.zip`
    const PathBackup = path.join(bds.backup_folder, name);
    if (process.env.BDS_DOCKER_IMAGE !== "true") if (bds.bds_detect()) bds.stop();

    // Bedrock
    if (existsSync(join(bds.bds_dir_bedrock, (function (){var bedrockExec;if (process.platform === "win32") bedrockExec = "bedrock_server.exe";else if (process.platform === "linux") bedrockExec = "bedrock_server";return bedrockExec;})()))) {
        zip.addLocalFolder(path.join(bds.bds_dir_bedrock, "worlds"), join("bedrock", "worlds"));
        for (let index of [
            "server.properties",
            "permissions.json",
            "whitelist.json"
        ]) if (existsSync(join(bds.bds_dir_bedrock, index))) zip.addLocalFile(join(bds.bds_dir_bedrock, index), "bedrock");
    }
    else console.info("Skipping the bedrock as it was not installed");
    // Java
    if (existsSync(join(bds.bds_dir_java, "MinecraftServerJava.jar"))) {
        let javaDir = readdirSync(bds.bds_dir_java).filter(function(value) {if (value === "banned-ips.json" || value === "banned-players.json" || value === "eula.txt" || value === "logs" || value === "ops.json" || value === "server.jar" || value === "MinecraftServerJava.jar" || value === "server.properties" || value === "usercache.json" || value === "whitelist.json") return false;return true});
        for (let index of javaDir) zip.addLocalFolder(join(bds.bds_dir_java, index), join("java", index))
        for (let index of [
            "banned-ips.json",
            "banned-players.json",
            "ops.json",
            "server.properties",
            "whitelist.json"
        ]) if (existsSync(join(bds.bds_dir_java, index))) zip.addLocalFile(join(bds.bds_dir_java, index), "java");
    } else console.info("Skipping the java as it was not installed");
    // PocketMine
    if (existsSync(join(bds.bds_dir_pocketmine, "PocketMine-MP.phar"))) {
        zip.addLocalFolder(join(bds.bds_dir_pocketmine, "worlds"), join("pocketmine", "worlds"));
        for (let index of [
            "pocketmine.yml",
            "server.properties",
            "white-list.txt",
            "ops.txt",
            "banned-players.txt",
            "banned-ips.txt"
        ]) if (existsSync(join(bds.bds_dir_pocketmine, index))) zip.addLocalFile(join(bds.bds_dir_pocketmine, index), "pocketmine");
    }
    else console.info("Skipping the pocketmine as it was not installed");
    // The Bds Maneger Core Backup
    for (let index of [
        "bds_config.json",
        "bds_maneger-config.json",
        "bds_tokens.json",
        "bds_users.json"
    ]) if (existsSync(join(bds.bds_dir, index))) zip.addLocalFile(join(bds.bds_dir, index));

    zip.addZipComment("Settings and World Backups, by The Bds Maneger Project©");
    zip.writeZip(PathBackup);
    return {
        "file_path": PathBackup,
        "file_name": name
    }
}
module.exports.World_BAckup = backup_world
module.exports.Drive_backup = backup_world
