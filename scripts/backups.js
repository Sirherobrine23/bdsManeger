const bds = require("../index")
const { join } = require("path");
const { readdirSync, existsSync, readFileSync } = require("fs")
const AdmZip = require("adm-zip");
const { GetServerPaths, GetPaths, bds_dir } = require("../lib/BdsSettings")

function Backup() {
    const zip = new AdmZip();
    console.info("Please wait");
    // Names And Path"s
    const Paths = {
        bedrock: GetServerPaths("bedrock"),
        java: GetServerPaths("java"),
        pocketmine: GetServerPaths("pocketmine"),
        jsprismarine: GetServerPaths("jsprismarine")
    }
    const name = `Bds_Maneger-Backups_${bds.date()}.zip`
    const PathBackup = join(GetPaths("backups"), name);

    // Bedrock
    if (existsSync(join(Paths.bedrock, (() => {if (process.platform === "win32") return  "bedrock_server.exe";else if (process.platform === "linux") return  "bedrock_server";})()))) {
        zip.addLocalFolder(join(Paths.bedrock, "worlds"), join("Servers", "bedrock", "worlds"));
        for (let index of [
            "server.properties",
            "permissions.json",
            "whitelist.json"
        ]) if (existsSync(join(Paths.bedrock, index))) zip.addLocalFile(join(Paths.bedrock, index), join("Servers", "bedrock"));
    } else console.info("Skipping the bedrock as it was not installed");

    // Java
    if (existsSync(join(Paths.java, "MinecraftServerJava.jar"))) {
        let javaDir = readdirSync(Paths.java).filter(function(value) {if (value === "banned-ips.json" || value === "banned-players.json" || value === "eula.txt" || value === "logs" || value === "ops.json" || value === "server.jar" || value === "MinecraftServerJava.jar" || value === "server.properties" || value === "usercache.json" || value === "whitelist.json") return false;return true});
        for (let index of javaDir) zip.addLocalFolder(join(Paths.java, index), join("Servers", "java", index))
        for (let index of [
            "banned-ips.json",
            "banned-players.json",
            "ops.json",
            "server.properties",
            "whitelist.json"
        ]) if (existsSync(join(Paths.java, index))) zip.addLocalFile(join(Paths.java, index), join("Servers", "java"));
    } else console.info("Skipping the java as it was not installed");

    // PocketMine
    if (existsSync(join(Paths.pocketmine, "PocketMine-MP.phar"))) {
        if (existsSync(join(Paths.pocketmine, "worlds"))) zip.addLocalFolder(join(Paths.pocketmine, "worlds"), join("Servers", "pocketmine", "worlds"));
        for (let index of [
            "pocketmine.yml",
            "server.properties",
            "white-list.txt",
            "ops.txt",
            "banned-players.txt",
            "banned-ips.txt"
        ]) if (existsSync(join(Paths.pocketmine, index))) zip.addLocalFile(join(Paths.pocketmine, index), "pocketmine");
    } else console.info("Skipping the pocketmine as it was not installed");


    // JSPrismarine

    // The Bds Maneger Core Backup
    for (let index of [
        "BdsConfig.yaml",
        "bds_tokens.json"
    ]) if (existsSync(join(bds_dir, index))) zip.addLocalFile(join(bds_dir, index));

    zip.addZipComment("Settings and World Backups, by The Bds Maneger Project©");
    zip.writeZip(PathBackup);
    return {
        file_path: PathBackup,
        file_name: name,
        Buffer: readFileSync(PathBackup)
    }
}

module.exports = {
    World_BAckup: Backup,
    Backup: Backup,
    Cloud_backup: Backup
}