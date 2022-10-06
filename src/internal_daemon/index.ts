import { tmpdir } from "node:os";
import express from "express";
import fs from "node:fs";
import fsPromise from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import * as bdsCore from "../index";

const expressRoot = express();
const app = express.Router();
const sessions: {[sessionId: string]: bdsCore.globalPlatfroms.actions} = {};

// Listen socks
const bdsdAuth = path.join(bdsCore.platformPathManeger.bdsRoot, "bdsd_auth.json");
const sockListen = path.join(tmpdir(), "bdsd.sock");
if (fs.existsSync(sockListen)) fs.rmSync(sockListen, {force: true});
expressRoot.listen(sockListen, () => console.info("Socket listen on %s", sockListen));
expressRoot.listen(3000, () => console.info("Socket listen on %s", 3000));
expressRoot.disable("x-powered-by").disable("etag");
expressRoot.use(express.json());
expressRoot.use(express.urlencoded({extended: true}));
expressRoot.use((_req, res, next) => {res.json = (body: any) => res.setHeader("Content-Type", "application/json").send(JSON.stringify(body, null, 2)); return next();});
expressRoot.use(async (req, res, next) => {
  // Allow by default socket
  if (!req.socket.remoteAddress && !req.socket.remotePort) {
    res.setHeader("AuthSocket", "true");
    return next();
  }

  // External requests
  if (!fs.existsSync(bdsdAuth)) {
    if (!fs.existsSync(bdsCore.platformPathManeger.bdsRoot)) await fsPromise.mkdir(bdsCore.platformPathManeger.bdsRoot, {recursive: true});
    const keys = crypto.generateKeyPairSync("rsa", {modulusLength: 4096, publicKeyEncoding: {type: "spki", format: "pem"}, privateKeyEncoding: {type: "pkcs8", format: "pem", cipher: "aes-256-cbc", passphrase: crypto.randomBytes(128).toString("hex")}});
    await fsPromise.writeFile(bdsdAuth, JSON.stringify(keys, null, 2));
    console.log("Bdsd Keys\n\nPublic base64: '%s'\Ppublic: '%s'", Buffer.from(keys.publicKey).toString("base64"), keys.publicKey);
    return res.status(204).json({
      message: "Generated keys, re-auth with new public key!"
    });
  }

  if (!req.headers.authorization) return res.status(400).json({error: "Send authorization with public key!"});
  const authorizationPub = Buffer.from(req.headers.authorization.replace(/^.*\s+/, ""), "base64").toString("utf8").trim();
  const publicKey = (JSON.parse(await fsPromise.readFile(bdsdAuth, "utf8")) as crypto.KeyPairSyncResult<string, string>).publicKey.trim();
  if (publicKey === authorizationPub) return next();
  return res.status(400).json({
    error: "Invalid auth or incorret public key"
  });
});

// v1 routes
expressRoot.use("/v1", app);

// Send Status
app.get("/", ({res}) => res.json({version: "v1", support: true}));

// Send Sessions
app.get("/sessions", ({res}) => res.json(sessions));

// Install server
app.put("/server", async (req, res) => {
  if (!req.body||Object.keys(req.body).length === 0) return res.status(400).json({
    error: "Body is empty"
  });
  const action = req.body.action as "install"|"start";
  const platform = req.body.platform as bdsCore.pluginHooks.hooksPlatform;
  if (action === "install" && req.body.version === undefined) req.body.version = "latest";

  if (platform === "bedrock") {
    if (action === "install") return res.json(await bdsCore.Bedrock.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.Bedrock.startServer(req.body.platformOptions);
      sessions[platform.id] = platform;
      return res.json({
        id: platform.id
      });
    }
  } else if (platform === "pocketmine") {
    if (action === "install") return res.json(await bdsCore.PocketmineMP.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.PocketmineMP.startServer(req.body.platformOptions);
      sessions[platform.id] = platform;
      return res.json({
        id: platform.id
      });
    }
  } else if (platform === "java") {
    if (action === "install") return res.json(await bdsCore.Java.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.Java.startServer(req.body.javaOptions);
      sessions[platform.id] = platform;
      return res.json({
        id: platform.id
      });
    }
  } else if (platform === "paper") {
    if (action === "install") return res.json(await bdsCore.PaperMC.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.PaperMC.startServer(req.body.javaOptions);
      sessions[platform.id] = platform;
      return res.json({
        id: platform.id
      });
    }
  } else if (platform === "spigot") {
    if (action === "install") return res.json(await bdsCore.Spigot.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.Spigot.startServer(req.body.javaOptions);
      sessions[platform.id] = platform;
      return res.json({
        id: platform.id
      });
    }
  } else if (platform === "powernukkit") {
    if (action === "install") return res.json(await bdsCore.Powernukkit.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.Powernukkit.startServer(req.body.javaOptions);
      sessions[platform.id] = platform;
      return res.json({
        id: platform.id
      });
    }
  }

  return res.status(400).json({
    error: "Invalid action"
  });
});

app.get("/server/log/:id", (req, res) => {
  const session = sessions[req.params.id];
  if (!session) return res.status(400).json({error: "Session ID not exists!"});
  res.writeHead(101, {
    Upgrade: "WebSocket",
    Connection: "Upgrade"
  });
  if (session.processConfig.options?.logPath?.stdout) {
    const log = fs.createReadStream(session.processConfig.options.logPath.stdout, {encoding: "utf8"});
    log.on("data", data => res.write(data));
  }
  session.on("log", log => res.write(log));
  return res;
});

app.put("/server/command/:id", (req, res) => {
  const session = sessions[req.params.id];
  if (!session) return res.status(400).json({error: "Session ID not exists!"});
  session.runCommand(req.body?.command);
  return res;
});

app.get("/server/ws/:id", (req, res) => {
  const session: bdsCore.globalPlatfroms.actions = sessions[req.params.id];
  if (!session) return res.status(400).json({error: "Session ID not exists!"});
  const sendAction = (action: string, body: any) => res.write(JSON.stringify({action, data: body}));
  session.on("playerDisconnect", data => sendAction("playerDisconnect", data));
  session.on("playerConnect", data => sendAction("playerConnect", data));
  session.on("portListening", data => sendAction("portListening", data));
  session.on("serverStarted", data => sendAction("serverStarted", data));
  return res;
});

app.get("/server/:id", (req, res) => {
  const session: bdsCore.globalPlatfroms.actions = sessions[req.params.id];
  if (!session) return res.status(400).json({error: "Session ID not exists!"});
  return res.json({
    port: session.portListening,
    players: session.playerActions
  });
});

expressRoot.all("*", (req, res) => res.status(404).json({
  error: "Page not found",
  path: req.path
}));

expressRoot.use((error, _1, res, _3) => {
  return res.status(500).json({
    internalError: String(error).replace(/Error:\s+/, ""),
  });
});