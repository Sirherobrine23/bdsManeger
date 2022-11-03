import { bufferFetch } from "@http/simples"
import type { bedrockSchema } from "./db/bedrock";
import type { javaSchema } from "./db/java";
import type { paperSchema } from "./db/paper";
import type { powernukkitSchema } from "./db/powernukkit";
import type { pocketminemmpSchema } from "./db/pocketmine";
import type { spigotSchema } from "./db/spigot";

export type BdsCorePlatforms = "bedrock"|"java"|"paper"|"powernukkit"|"pocketmine"|"spigot";
export type all = bedrockSchema|javaSchema|powernukkitSchema|paperSchema|pocketminemmpSchema|spigotSchema
export type {
  bedrockSchema as bedrock,
  javaSchema as java,
  paperSchema as paper,
  pocketminemmpSchema as pocketmine,
  spigotSchema as spigot,
  powernukkitSchema as powernukkit
}

export async function findVersion<PlatformSchema = all[]>(bdsPlaform: BdsCorePlatforms): Promise<PlatformSchema>;
export async function findVersion<PlatformSchema = all>(bdsPlaform: BdsCorePlatforms, version: string|boolean): Promise<PlatformSchema>;
export async function findVersion<PlatformSchema = all>(bdsPlaform: BdsCorePlatforms, version: string|boolean, ignoreStatic: boolean): Promise<PlatformSchema>;
export async function findVersion<PlatformSchema = all|all[]>(bdsPlaform: BdsCorePlatforms, version?: string|boolean, ignoreStatic?: boolean): Promise<PlatformSchema> {
  const versionURLs = ["https://mcpeversions_backup.sirherobrine23.org", "https://mcpeversions.sirherobrine23.org"];
  if (!ignoreStatic) versionURLs.push("https://mcpeversion-static.sirherobrine23.org/"); else console.warn("Using dynamic APIs, some may be down!");
  for (let url of versionURLs.reverse()) {
    url += "/"+bdsPlaform;
    if (/static/.test(url)) {
      if (version === undefined) url += "/all.json";
      else if (typeof version === "boolean") url += "/latest.json";
      else url += `/${version}.json`;
    } else {
      if (version === undefined||version === "all") url += "/";
      else {
        if (typeof version === "boolean"||version === "latest") url += "/latest";
        else url += `/search?version=${version}`;
      }
    }
    const res = await bufferFetch(url).then(({data}) => data).catch(() => false);
    if (res === false) continue;
    const data = JSON.parse(res.toString("utf8"), (key, value) => key === "date" ? new Date(value):value);
    if (!data) throw new Error("Failed to get data");
    return data;
  }
  throw new Error("Failed to exec API request!");
}

export const platformManeger = {
  bedrock: {
    async all(){return findVersion<bedrockSchema[]>("bedrock");},
    async find(version: string|boolean){return findVersion<bedrockSchema>("bedrock", version);}
  },
  pocketmine: {
    async all(){return findVersion<pocketminemmpSchema[]>("pocketmine");},
    async find(version: string|boolean){return findVersion<pocketminemmpSchema>("pocketmine", version);}
  },
  powernukkit: {
    async all(){return findVersion<powernukkitSchema[]>("powernukkit");},
    async find(version: string|boolean){return findVersion<powernukkitSchema>("powernukkit", version);}
  },
  java: {
    async all(){return findVersion<javaSchema[]>("java");},
    async find(version: string|boolean){return findVersion<javaSchema>("java", version);}
  },
  spigot: {
    async all(){return findVersion<spigotSchema[]>("spigot");},
    async find(version: string|boolean){return findVersion<spigotSchema>("spigot", version);}
  },
  paper: {
    async all(){return findVersion<paperSchema[]>("paper");},
    async find(version: string|boolean, build?: number|string){
      if (!build) build = (await findVersion<paperSchema[]>("paper")).find(ver => ver.version === version)?.build;
      return findVersion<paperSchema>("paper", `${version}${!!build?"_"+build:""}`);
    }
  }
};
