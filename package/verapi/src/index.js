#!/usr/bin/env node
import { Java, Bedrock } from "@the-bds-maneger/core";
import { createServer } from "node:http";
import express from "express";
import expressLayer from "express/lib/router/layer.js";
expressLayer.prototype.handle_request = async function handle_request_promised(...args) {
  var fn = this.handle;
  if (fn.length > 3) return args.at(-1)();
  await Promise.resolve().then(() => fn.call(this, ...args)).catch(args.at(-1));
}
const app = express();
const server = createServer(app);
server.listen(Number(process.env.PORT || 3000), () => {
  const addr = server.address();
  console.log("Listening on http://localhost:%f", Number(typeof addr === "object" ? addr.port : addr));
});

// Bedrock
const bedrockRoute = express.Router();
app.use("/bedrock", bedrockRoute);
const bedrockStash = {};
bedrockRoute.get("/", async ({res}) => {
  const bedrockOficial = (await (async () => {if (bedrockStash["oficial"]) return bedrockStash["oficial"];bedrockStash["oficial"] = await Bedrock.listVersions();setTimeout(() => delete bedrockStash["oficial"], 60000);return bedrockStash["oficial"];})()).filter(rel => rel.release === "stable").at(0);
  const cloudbust = (await (async () => {if (bedrockStash["cloudbust"]) return bedrockStash["cloudbust"];bedrockStash["cloudbust"] = await Bedrock.listVersions("cloudbust");setTimeout(() => delete bedrockStash["cloudbust"], 60000);return bedrockStash["cloudbust"];})()).at(0);
  const nukkit = (await (async () => {if (bedrockStash["nukkit"]) return bedrockStash["nukkit"];bedrockStash["nukkit"] = await Bedrock.listVersions("nukkit");setTimeout(() => delete bedrockStash["nukkit"], 60000);return bedrockStash["nukkit"];})()).at(0);
  const powernukkit = (await (async () => {if (bedrockStash["powernukkit"]) return bedrockStash["powernukkit"];bedrockStash["powernukkit"] = await Bedrock.listVersions("powernukkit");setTimeout(() => delete bedrockStash["powernukkit"], 60000);return bedrockStash["powernukkit"];})()).at(0);
  const pocketmine = (await (async () => {if (bedrockStash["pocketmine"]) return bedrockStash["pocketmine"];bedrockStash["pocketmine"] = await Bedrock.listVersions("pocketmine");setTimeout(() => delete bedrockStash["pocketmine"], 60000);return bedrockStash["pocketmine"];})()).filter(rel => rel.release === "stable").at(0);

  return res.json({
    bedrockOficial,
    pocketmine,
    cloudbust,
    nukkit,
    powernukkit
  });
});
bedrockRoute.get("/((oficial|cloudbust|nukkit|nukkit|powernukkit|pocketmine))", async (req, res) => {
  let platform = req.params[0];
  if (!bedrockStash[platform]) {
    if (platform === "oficial") platform = null;
    bedrockStash[(platform === null ? "oficial" : platform)] = await Bedrock.listVersions(platform);
    setTimeout(() => delete bedrockStash[(platform === null ? "oficial" : platform)], 60000);
  }
  const list = bedrockStash[(platform === null ? "oficial" : platform)];
  const ver = String(req.query.v || req.query.version || "");
  if (ver) {
    const data = list.find(e => e.version === ver);
    if (!data) return res.status(400).json({error: "Not found version."});
    return res.json(data);
  }
  return res.json(list);
});

// Java
const javaRoute = express.Router();
app.use("/java", javaRoute);
const javaStash = {};
javaRoute.get("/", async ({res}) => {
  const javaOficial = (await (async () => {if (javaStash["oficial"]) return javaStash["oficial"]; javaStash["oficial"] = await Java.listVersions(); setTimeout(() => delete javaStash["oficial"], 6000); return javaStash["oficial"];})()).filter(rel => rel.release === "stable").at(0);
  const spigot = (await (async () => {if (javaStash["spigot"]) return javaStash["spigot"]; javaStash["spigot"] = await Java.listVersions("spigot"); setTimeout(() => delete javaStash["spigot"], 6000); return javaStash["spigot"];})()).at(0);
  const paper = (await (async () => {if (javaStash["paper"]) return javaStash["paper"]; javaStash["paper"] = await Java.listVersions("paper"); setTimeout(() => delete javaStash["paper"], 6000); return javaStash["paper"];})()).at(0);
  const glowstone = (await (async () => {if (javaStash["glowstone"]) return javaStash["glowstone"]; javaStash["glowstone"] = await Java.listVersions("glowstone"); setTimeout(() => delete javaStash["glowstone"], 6000); return javaStash["glowstone"];})()).at(0);
  const purpur = (await (async () => {if (javaStash["purpur"]) return javaStash["purpur"]; javaStash["purpur"] = await Java.listVersions("purpur"); setTimeout(() => delete javaStash["purpur"], 6000); return javaStash["purpur"];})()).at(0);
  const folia = (await (async () => {if (javaStash["folia"]) return javaStash["folia"]; javaStash["folia"] = await Java.listVersions("folia"); setTimeout(() => delete javaStash["folia"], 6000); return javaStash["folia"];})()).at(0);
  const cuberite = (await (async () => {if (javaStash["cuberite"]) return javaStash["cuberite"]; javaStash["cuberite"] = await Java.listVersions("cuberite"); setTimeout(() => delete javaStash["cuberite"], 6000); return javaStash["cuberite"];})()).at(0);

  return res.json({
    javaOficial,
    spigot,
    paper,
    glowstone,
    purpur,
    folia,
    cuberite
  });
});
javaRoute.get("/((oficial|spigot|paper|purpur|glowstone|folia|cuberite))", async (req, res) => {
  let platform = req.params[0];
  if (!javaStash[platform]) {
    if (platform === "oficial") platform = null;
    javaStash[(platform === null ? "oficial" : platform)] = await Java.listVersions(platform);
    setTimeout(() => delete javaStash[(platform === null ? "oficial" : platform)], 60000);
  }
  const list = javaStash[(platform === null ? "oficial" : platform)];
  const ver = String(req.query.v || req.query.version || "");
  if (ver) {
    const data = list.find(e => e.version === ver);
    if (!data) return res.status(400).json({error: "Not found version."});
    return res.json(data);
  }
  return res.json(list);
});

app.get("/", async ({res}) => {
  // Bedrock
  const bedrockOficial = (await (async () => {if (bedrockStash["oficial"]) return bedrockStash["oficial"];bedrockStash["oficial"] = await Bedrock.listVersions();setTimeout(() => delete bedrockStash["oficial"], 60000);return bedrockStash["oficial"];})()).filter(rel => rel.release === "stable").at(0);
  const cloudbust = (await (async () => {if (bedrockStash["cloudbust"]) return bedrockStash["cloudbust"];bedrockStash["cloudbust"] = await Bedrock.listVersions("cloudbust");setTimeout(() => delete bedrockStash["cloudbust"], 60000);return bedrockStash["cloudbust"];})()).at(0);
  const nukkit = (await (async () => {if (bedrockStash["nukkit"]) return bedrockStash["nukkit"];bedrockStash["nukkit"] = await Bedrock.listVersions("nukkit");setTimeout(() => delete bedrockStash["nukkit"], 60000);return bedrockStash["nukkit"];})()).at(0);
  const powernukkit = (await (async () => {if (bedrockStash["powernukkit"]) return bedrockStash["powernukkit"];bedrockStash["powernukkit"] = await Bedrock.listVersions("powernukkit");setTimeout(() => delete bedrockStash["powernukkit"], 60000);return bedrockStash["powernukkit"];})()).at(0);
  const pocketmine = (await (async () => {if (bedrockStash["pocketmine"]) return bedrockStash["pocketmine"];bedrockStash["pocketmine"] = await Bedrock.listVersions("pocketmine");setTimeout(() => delete bedrockStash["pocketmine"], 60000);return bedrockStash["pocketmine"];})()).filter(rel => rel.release === "stable").at(0);

  // Java
  const javaOficial = (await (async () => {if (javaStash["oficial"]) return javaStash["oficial"]; javaStash["oficial"] = await Java.listVersions(); setTimeout(() => delete javaStash["oficial"], 6000); return javaStash["oficial"];})()).filter(rel => rel.release === "stable").at(0);
  const spigot = (await (async () => {if (javaStash["spigot"]) return javaStash["spigot"]; javaStash["spigot"] = await Java.listVersions("spigot"); setTimeout(() => delete javaStash["spigot"], 6000); return javaStash["spigot"];})()).at(0);
  const paper = (await (async () => {if (javaStash["paper"]) return javaStash["paper"]; javaStash["paper"] = await Java.listVersions("paper"); setTimeout(() => delete javaStash["paper"], 6000); return javaStash["paper"];})()).at(0);
  const glowstone = (await (async () => {if (javaStash["glowstone"]) return javaStash["glowstone"]; javaStash["glowstone"] = await Java.listVersions("glowstone"); setTimeout(() => delete javaStash["glowstone"], 6000); return javaStash["glowstone"];})()).at(0);
  const purpur = (await (async () => {if (javaStash["purpur"]) return javaStash["purpur"]; javaStash["purpur"] = await Java.listVersions("purpur"); setTimeout(() => delete javaStash["purpur"], 6000); return javaStash["purpur"];})()).at(0);
  const folia = (await (async () => {if (javaStash["folia"]) return javaStash["folia"]; javaStash["folia"] = await Java.listVersions("folia"); setTimeout(() => delete javaStash["folia"], 6000); return javaStash["folia"];})()).at(0);
  const cuberite = (await (async () => {if (javaStash["cuberite"]) return javaStash["cuberite"]; javaStash["cuberite"] = await Java.listVersions("cuberite"); setTimeout(() => delete javaStash["cuberite"], 6000); return javaStash["cuberite"];})()).at(0);

  return res.json({
    bedrock: {
      bedrockOficial,
      pocketmine,
      cloudbust,
      nukkit,
      powernukkit
    },
    java: {
      javaOficial,
      spigot,
      paper,
      glowstone,
      purpur,
      folia,
      cuberite
    }
  })
});

// 404
app.use(({res}) => res.status(404).json({error: "Not found page."}));
app.use((error, _req, res, _next) => res.status(500).json({error: error?.message || String(error) || "Unknown error."}));