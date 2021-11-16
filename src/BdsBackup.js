const { join, resolve } = require("path");
const fs = require("fs");
const AdmZip = require("adm-zip");
const { GetServerPaths, GetPaths, bds_dir } = require("../src/lib/BdsSettings");

function Backup() {
  const zip = new AdmZip();
  console.info("Starting Bds Core Backup Along with the server maps, please wait");
  // Names And Path"s
  const Paths = {
    bedrock: GetServerPaths("bedrock"),
    java: GetServerPaths("java"),
    pocketmine: GetServerPaths("pocketmine"),
    spigot: GetServerPaths("spigot"),
    dragonfly: GetServerPaths("dragonfly"),
  }
  const CurrentDate = new Date();
  const ZipName = `Bds_Maneger_Core_Backups_${CurrentDate.getDate()}-${CurrentDate.getMonth()}-${CurrentDate.getFullYear()}.zip`
  const PathBackup = join(GetPaths("backups"), ZipName);

  // Bedrock
  if (fs.readdirSync(Paths.bedrock).filter(a=>/worlds/.test(a)).length >= 1) {
    zip.addLocalFolder(join(Paths.bedrock, "worlds"), join("Servers", "Bedrock", "worlds"));
    for (let index of ["server.properties", "permissions.json", "whitelist.json"]) {if (fs.existsSync(join(Paths.bedrock, index))) zip.addLocalFile(join(Paths.bedrock, index), join("Servers", "Bedrock"));}
  } else console.info("Skipping the bedrock as it was not installed");

  // Java
  if (fs.existsSync(join(Paths.java, "MinecraftServerJava.jar"))) {
    for (let index of fs.readdirSync(Paths.java).filter(value => !/banned-ips.json|banned-players.json|eula.txt|logs|ops.json|server.jar|MinecraftServerJava.jar|server.properties|usercache.json|whitelist.json/.test(value))) zip.addLocalFolder(join(Paths.java, index), join("Servers", "Java", index));
    for (let index of ["banned-ips.json", "banned-players.json", "ops.json", "server.properties", "whitelist.json"]) {if (fs.existsSync(join(Paths.java, index))) zip.addLocalFile(join(Paths.java, index), join("Servers", "Java"))}
  } else console.info("Skipping the java as it was not installed");

  // PocketMine
  if (fs.existsSync(join(Paths.pocketmine, "PocketMine-MP.phar"))) {
    if (fs.existsSync(join(Paths.pocketmine, "worlds"))) zip.addLocalFolder(join(Paths.pocketmine, "worlds"), join("Servers", "pocketmine", "worlds"));
    for (let index of ["pocketmine.yml", "server.properties", "white-list.txt", "ops.txt", "banned-players.txt", "banned-ips.txt"]) if (fs.existsSync(join(Paths.pocketmine, index))) zip.addLocalFile(join(Paths.pocketmine, index), "pocketmine");
  } else console.info("Skipping the pocketmine as it was not installed");

  // Spigot
  if (fs.existsSync(join(Paths.spigot, "spigot.jar"))) {
    if (fs.existsSync(join(Paths.spigot, "worlds"))) zip.addLocalFolder(join(Paths.spigot, "worlds"), join("Servers", "spigot", "worlds"));
    for (let index of ["spigot.yml", "server.properties", "white-list.txt", "ops.txt", "banned-players.txt", "banned-ips.txt"]) if (fs.existsSync(join(Paths.spigot, index))) zip.addLocalFile(join(Paths.spigot, index), "spigot");
  } else console.info("Skipping the spigot as it was not installed");

  // Dragonfly
  if (fs.existsSync(join(Paths.dragonfly, "config.toml"))) {
    for (let index of fs.readdirSync(Paths.dragonfly).map(value => join(Paths.dragonfly, value))) {
      if (fs.lstatSync(index).isDirectory()) zip.addLocalFolder(index, join("Servers", "dragonfly"));
      else if (fs.lstatSync(index).isFile()) zip.addLocalFile(index, join("Servers", "dragonfly"));
    }
  } else console.info("Skipping the dragonfly as it was not installed");

  // The Bds Maneger Core Backup
  for (let index of ["BdsConfig.yaml", "bds_tokens.json"]) if (fs.existsSync(join(bds_dir, index))) zip.addLocalFile(join(bds_dir, index));
  
  for (let index of Object.getOwnPropertyNames(GetPaths("all")).filter(path => !/servers|backups/.test(path)).map(name => GetPaths(name))) {
    if (fs.existsSync(index)) {
      const _S = fs.statSync(resolve(index));
      if (_S.isFile() || _S.isSymbolicLink()) zip.addLocalFile(index, "/BdsManegerCore"); else zip.addLocalFolder(index, join("/BdsManegerCore", index.replace(bds_dir, "")));
    }
  }

  zip.addZipComment("Settings and World Backups, by The Bds Maneger Project©");

  // Zip Buffer
  const ZipBuffer = zip.toBuffer();
  fs.writeFileSync(PathBackup, ZipBuffer, "binary");
  console.log("Backup Complete");
  return {
    file_path: PathBackup,
    Buffer: ZipBuffer,
    file_name: ZipName,
  }
}

module.exports = {
  World_BAckup: Backup,
  Backup: Backup,
  Cloud_backup: Backup
}