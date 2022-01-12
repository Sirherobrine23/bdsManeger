const path = require("path");
const fs = require("fs");
const AdmZip = require("adm-zip");
const BdsSettings = require("../src/lib/BdsSettings");

function CreateZipBuffer() {
  const Zip = new AdmZip();
  const Functions = {};

  /**
   * Add file or folder to zip file
   */
  Functions.Add = (Path = "", Name = path.basename(Path)) => {
    const _S = fs.statSync(path.resolve(Path));
    if (_S.isFile()) Zip.addLocalFile(Path, Name);
    else Zip.addLocalFolder(Path, Name);
  }

  /**
   * Get Buffer to File Zip, not parse arguments to Get Buffer.
   * 
   * Parse arguments to Write file in path argument.
   */
  Functions.WriteOrBuffer = (Path = "") => {
    if (!Path) return Zip.toBuffer();
    else fs.writeFileSync(Path, Zip.toBuffer(), "binary");
  }

  Functions.AdmZip = Zip;
  return Functions;
}

function CreateBackup() {
  const ZipFile = CreateZipBuffer();
  ZipFile.AdmZip.addZipComment("Settings and World Backups, by The Bds Maneger Project©");

  // Bedrock
  const BedrockPath = BdsSettings.GetPaths("bedrock", true);
  if (fs.existsSync(path.join(BedrockPath, "worlds"))) ZipFile.Add(path.join(BedrockPath, "worlds"), "Server/bedrock/worlds");
  if (fs.existsSync(path.join(BedrockPath, "server.properties"))) ZipFile.Add(path.join(BedrockPath, "server.properties"), "Server/bedrock");
  if (fs.existsSync(path.join(BedrockPath, "permissions.json"))) ZipFile.Add(path.join(BedrockPath, "permissions.json"), "Server/bedrock");
  if (fs.existsSync(path.join(BedrockPath, "whitelist.json"))) ZipFile.Add(path.join(BedrockPath, "whitelist.json"), "Server/bedrock");

  // Java
  const JavaPath = BdsSettings.GetPaths("java", true);
  for (const JavaFiles of fs.readdirSync(JavaPath)) {
    if (!/eula.txt|logs|.*.jar|usercache.json/.test(JavaFiles)) {
      ZipFile.Add(path.join(JavaPath, JavaFiles), "Server/java/");
    }
  }

  const CurrentDate = new Date();
  const ZipName = `Bds_Maneger_Core_Backups_${CurrentDate.getDate()}-${CurrentDate.getMonth()}-${CurrentDate.getFullYear()}.zip`
  const PathBackup = path.join(BdsSettings.GetPaths("Backup"), ZipName);
  return {
    FilePath: PathBackup,
    FileName: ZipName,
    file_path: PathBackup,
    file_name: ZipName,
    Buffer: ZipFile.WriteOrBuffer(),
    write_file: () => ZipFile.WriteOrBuffer(PathBackup)
  }
}
module.exports.CreateBackup = CreateBackup;