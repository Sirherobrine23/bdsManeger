#!/usr/bin/env node
import { Bedrock, Java } from "@the-bds-maneger/core";
import express from "express";
import expressLayer from "express/lib/router/layer.js";
import { createServer } from "node:http";
import { format } from "node:util";

process.on("unhandledRejection", err => console.error(err));

expressLayer.prototype.handle_request = async function handle_request_promised(...args) {
  var fn = this.handle;
  if (fn.length > 3) return args.at(-1)();
  await Promise.resolve().then(() => fn.call(this, ...args)).catch(args.at(-1));
}

/**
 * @param {number} nextTime
 */
function printDate(nextTime = 0) {
  const dd = new Date(Date.now() + nextTime);
  return format("%f/%f/%f %f:%f:%f", dd.getDate(), dd.getMonth() + 1, dd.getFullYear(), dd.getMinutes(), dd.getHours(), dd.getSeconds());
}

const interval = 1000 * 60 * 60 * 2;
console.log("Initial versions");
await Promise.all([Bedrock.listVersion.syncCaches(), Java.listVersion.syncCaches()]);
console.log("Next sync in", printDate(interval));
setInterval(async () => {
  console.log("Sync versions");
  await Promise.all([Bedrock.listVersion.syncCaches(), Java.listVersion.syncCaches()]);
  console.log("Next sync in", printDate(interval));
}, interval);

const app = express();
app.use((req, res, next) => {
  if (!(req.query.pretty === "off" || req.query.pretty === "false")) {
    res.json = (body) => res.setHeader("Content-Type", "application/json").send(JSON.stringify(body, null, 2));
  }
  next();
});

const server = createServer(app);
server.listen(Number(process.env.PORT || 3000), () => {
  const addr = server.address();
  if (typeof addr === "string") console.log("Server listen on socket %O path", addr);
  else if (typeof addr === "number") console.log("Listening on http://localhost:%f", addr);
  else if (typeof addr === "object") console.log("Listen on http://localhost:%s", addr?.port);
});

// Bedrock
const bedrockRoute = express.Router();
app.use("/bedrock", bedrockRoute);
bedrockRoute.get("/", async ({ res }) => {
  return res.json({
    bedrockOficial: Bedrock.listVersion.mojangCache,
    pocketmine: Bedrock.listVersion.pocketmineCache,
    cloudbust: Bedrock.listVersion.cloudburstCache,
    nukkit: Bedrock.listVersion.nukkitCache,
    powernukkit: Bedrock.listVersion.powernukkitCache
  });
});

bedrockRoute.get("/((oficial|cloudbust|nukkit|nukkit|powernukkit|pocketmine))", async (req, res) => {
  /** @type {"oficial" | "cloudbust" | "nukkit" | "nukkit" | "powernukkit" | "pocketmine"} */
  const platform = req.params[0];
  const ver = String(req.query.v || req.query.version || "");
  if (platform === "oficial") {
    if (!ver) return res.json(Bedrock.listVersion.mojangCache.toJSON());
    else {
      if (!(Bedrock.listVersion.mojangCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Bedrock.listVersion.mojangCache.get(ver));
    }
  } else if (platform === "pocketmine") {
    if (!ver) return res.json(Bedrock.listVersion.pocketmineCache.toJSON());
    else {
      if (!(Bedrock.listVersion.pocketmineCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Bedrock.listVersion.pocketmineCache.get(ver));
    }
  } else if (platform === "nukkit") {
    if (!ver) return res.json(Bedrock.listVersion.nukkitCache.toJSON());
    else {
      if (!(Bedrock.listVersion.nukkitCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Bedrock.listVersion.nukkitCache.get(ver));
    }
  } else if (platform === "cloudbust") {
    if (!ver) return res.json(Bedrock.listVersion.cloudburstCache.toJSON());
    else {
      if (!(Bedrock.listVersion.cloudburstCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Bedrock.listVersion.cloudburstCache.get(ver));
    }
  } else if (platform === "powernukkit") {
    if (!ver) return res.json(Bedrock.listVersion.powernukkitCache.toJSON());
    else {
      if (!(Bedrock.listVersion.powernukkitCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Bedrock.listVersion.powernukkitCache.get(ver));
    }
  }
});

// Java
const javaRoute = express.Router();
app.use("/java", javaRoute);
javaRoute.get("/", async ({ res }) => {
  return res.json({
    javaOficial: Java.listVersion.mojangCache,
    spigot: Java.listVersion.spigotCache,
    paper: Java.listVersion.paperCache,
    glowstone: Java.listVersion.glowstoneCache,
    purpur: Java.listVersion.purpurCache,
    folia: Java.listVersion.foliaCache,
    cuberite: Java.listVersion.cuberiteCache
  });
});
javaRoute.get("/((oficial|spigot|paper|purpur|glowstone|folia|cuberite))", async (req, res) => {
  /** @type {"oficial" | "spigot" | "paper" | "purpur" | "glowstone" | "folia" | "cuberite"} */
  const platform = req.params[0];
  const ver = String(req.query.v || req.query.version || "");
  if (platform === "oficial") {
    if (!ver) return res.json(Java.listVersion.mojangCache.toJSON());
    else {
      if (!(Java.listVersion.mojangCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Java.listVersion.mojangCache.get(ver));
    }
  } else if (platform === "spigot") {
    if (!ver) return res.json(Java.listVersion.spigotCache.toJSON());
    else {
      if (!(Java.listVersion.spigotCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Java.listVersion.spigotCache.get(ver));
    }
  } else if (platform === "paper") {
    if (!ver) return res.json(Java.listVersion.paperCache.toJSON());
    else {
      if (!(Java.listVersion.paperCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Java.listVersion.paperCache.get(ver));
    }
  } else if (platform === "purpur") {
    if (!ver) return res.json(Java.listVersion.purpurCache.toJSON());
    else {
      if (!(Java.listVersion.purpurCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Java.listVersion.purpurCache.get(ver));
    }
  } else if (platform === "glowstone") {
    if (!ver) return res.json(Java.listVersion.glowstoneCache.toJSON());
    else {
      if (!(Java.listVersion.glowstoneCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Java.listVersion.glowstoneCache.get(ver));
    }
  } else if (platform === "cuberite") {
    if (!ver) return res.json(Java.listVersion.cuberiteCache.toJSON());
    else {
      if (!(Java.listVersion.cuberiteCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Java.listVersion.cuberiteCache.get(ver));
    }
  } else if (platform === "folia") {
    if (!ver) return res.json(Java.listVersion.foliaCache.toJSON());
    else {
      if (!(Java.listVersion.foliaCache.has(ver))) return res.status(400).json({error: "This version not exists!"});
      return res.json(Java.listVersion.foliaCache.get(ver));
    }
  }
});

app.get("/", async ({ res }) => {
  return res.json({
    bedrock: {
      bedrockOficial: Bedrock.listVersion.mojangCache,
      pocketmine: Bedrock.listVersion.pocketmineCache,
      cloudbust: Bedrock.listVersion.cloudburstCache,
      nukkit: Bedrock.listVersion.nukkitCache,
      powernukkit: Bedrock.listVersion.powernukkitCache
    },
    java: {
      javaOficial: Java.listVersion.mojangCache,
      spigot: Java.listVersion.spigotCache,
      paper: Java.listVersion.paperCache,
      glowstone: Java.listVersion.glowstoneCache,
      purpur: Java.listVersion.purpurCache,
      folia: Java.listVersion.foliaCache,
      cuberite: Java.listVersion.cuberiteCache
    }
  })
});

// 404
app.use(({ res }) => res.status(404).json({ error: "Not found page." }));
app.use((error, _req, res, _next) => res.status(500).json({ error: error?.message || String(error) || "Unknown error." }));