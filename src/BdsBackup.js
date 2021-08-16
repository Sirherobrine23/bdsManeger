const { join, resolve } = require("path");
const { readdirSync, existsSync, readFileSync, statSync } = require("fs")
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
    const CurrentDate = new Date();
    const name = `Bds_Maneger_Core_Backups_${CurrentDate.getDate()}-${CurrentDate.getMonth()}-${CurrentDate.getFullYear()}.zip`
    const PathBackup = join(GetPaths("backups"), name);

    // Bedrock
    if (readdirSync(Paths.bedrock).filter(a=>/worlds/.test(a)).length >= 1) {
        zip.addLocalFolder(join(Paths.bedrock, "worlds"), join("Servers", "Bedrock", "worlds"));
        for (let index of ["server.properties", "permissions.json", "whitelist.json"]) {if (existsSync(join(Paths.bedrock, index))) zip.addLocalFile(join(Paths.bedrock, index), join("Servers", "Bedrock"));}
    } else console.info("Skipping the bedrock as it was not installed");

    // Java
    if (existsSync(join(Paths.java, "MinecraftServerJava.jar"))) {
        for (let index of readdirSync(Paths.java).filter(value => !/banned-ips.json|banned-players.json|eula.txt|logs|ops.json|server.jar|MinecraftServerJava.jar|server.properties|usercache.json|whitelist.json/.test(value))) zip.addLocalFolder(join(Paths.java, index), join("Servers", "Java", index));
        for (let index of ["banned-ips.json", "banned-players.json", "ops.json", "server.properties", "whitelist.json"]) {if (existsSync(join(Paths.java, index))) zip.addLocalFile(join(Paths.java, index), join("Servers", "Java"))}
    } else console.info("Skipping the java as it was not installed");

    // PocketMine
    if (existsSync(join(Paths.pocketmine, "PocketMine-MP.phar"))) {
        if (existsSync(join(Paths.pocketmine, "worlds"))) zip.addLocalFolder(join(Paths.pocketmine, "worlds"), join("Servers", "pocketmine", "worlds"));
        for (let index of ["pocketmine.yml", "server.properties", "white-list.txt", "ops.txt", "banned-players.txt", "banned-ips.txt"]) if (existsSync(join(Paths.pocketmine, index))) zip.addLocalFile(join(Paths.pocketmine, index), "pocketmine");
    } else console.info("Skipping the pocketmine as it was not installed");

    // The Bds Maneger Core Backup
    for (let index of ["BdsConfig.yaml", "bds_tokens.json"]) if (existsSync(join(bds_dir, index))) zip.addLocalFile(join(bds_dir, index));
    
    for (let index of Object.getOwnPropertyNames(GetPaths("all")).filter(path => !/servers|backups/.test(path)).map(name => GetPaths(name))) {
        if (existsSync(index)) {
            const _S = statSync(resolve(index));
            if (_S.isFile() || _S.isSymbolicLink()) zip.addLocalFile(index, "/BdsManegerCore"); else zip.addLocalFolder(index, join("/BdsManegerCore", index.replace(bds_dir, "")));
        }
    }

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