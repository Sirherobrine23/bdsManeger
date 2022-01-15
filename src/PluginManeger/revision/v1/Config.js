const RawGithubUrl = "https://raw.githubusercontent.com/The-Bds-Maneger/Plugins_Repository/main";
/**
 * Parse /Config.y[a]ml/ to return a object with url, type and versions
 */
function Parse(RepositoryPath = "", BdsPlatform = "pocketmine", Config = {}) {
  for (let KeyArray of Object.keys(Config)) {
    if (!(KeyArray === "revision" || KeyArray === "name" || KeyArray === "type" || KeyArray === "versions")) console.error(`${KeyArray} is not supported`);
  }
  if (Config.type === undefined) throw new Error("Config Error: type not found");
  const NewConfig = {
    revision: "v1",
    type: String(Config.type).toLowerCase(),
    name: String(Config.name||""),
    versions: [
      {
        dependencies: [""],
        version: "",
        minimum: "",
        url: "",
      },
      {
        dependencies: [],
        version: 0,
        minimum: 0,
        url: "",
      },
    ]
  }; NewConfig.versions = [];
  if (BdsPlatform === "pocketmine") {
    for (const Version of Config.versions) {
      let AddObj = false;
      const { version, from, minimum, dependencies } = Version;
      if (version === undefined) throw new Error("Config Error: version not found");
      if (from === undefined) throw new Error("Config Error: from not found");
      const ObjVersion = {
        dependencies: dependencies || [],
        version: version,
        minimum: 0,
        url: "",
      };
      // Server Minimum version (0 is any version)
      if (typeof minimum === "string") ObjVersion.minimum = minimum;
      else if (typeof minimum === "number") ObjVersion.minimum = minimum;
      else ObjVersion.minimum = 0;
      if (version !== undefined) {
        // Pocketmine from poggit
        if (from === "poggit_pmmp") {
          if (typeof Config.name === "undefined") throw new Error("Config Error: name not found");
          const { poggit_id } = Version;
          if (typeof poggit_id === "undefined") ObjVersion.url = `https://poggit.pmmp.io/get/${Config.name.trim()}/${version}`;
          else ObjVersion.url = `https://poggit.pmmp.io/r/${typeof poggit_id === "number" ? parseInt(poggit_id) : poggit_id.trim()}/${Config.name}.phar`;
          AddObj = true;
        } else if (from === "file") {
          const { file } = Version;
          if (RepositoryPath === undefined) throw new Error("Config Error: RepositoryPath not found");
          if (typeof file === "string") {
            ObjVersion.url = `${RawGithubUrl}/${RepositoryPath}/${file.replace("./", "")}`;
            AddObj = true;
          } else throw new Error("Config Error: file not found");
        } else if (from === "github_release") {
          const { repository, file_name } = Version;
          if (typeof repository === "undefined") throw new Error("Config Error: repository not found");
          if (typeof file_name === "undefined") console.error("Config Error: file_name not defined, using default");
          ObjVersion.url = `https://github.com/releases/download/${repository}/${file_name || Config.name}.phar`;
          AddObj = true;
        } else if (from === "url") {
          const { url } = Version;
          if (typeof url === "undefined") throw new Error("Config Error: url not found");
          if (/^http[s]?:\/\//.test(url.trim())) {
            ObjVersion.url = url.trim();
            AddObj = true;
          }
        } else console.error(`Config Error: from ${from} not supported`);
      }
      if (AddObj) NewConfig.versions.push(ObjVersion);
    }
  }
  return NewConfig;
}

module.exports = {
  Parse
};
