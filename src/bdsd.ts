#!/usr/bin/env node
import os from "node:os";
import fs from "node:fs";
import fsPromise from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import express from "express";
import expressRateLimit from "express-rate-limit";
import * as bdsCore from "./index";
import * as Prometheus from "prom-client";
process.on("unhandledRejection", err => console.trace(err));
Prometheus.collectDefaultMetrics({prefix: "bdsd"});
const requests = new Prometheus.Counter({
  name: "bdsd_requests",
  help: "Total number of requests to the Server",
  labelNames: ["method", "from", "path"]
});

const expressRoot = express();
const app = express.Router();
const bdsdAuth = path.join(bdsCore.platformPathManeger.bdsRoot, "bdsd_auth.json");
const sockListen = path.join(os.tmpdir(), "bdsd.sock");
if (fs.existsSync(sockListen)) fs.rmSync(sockListen, {force: true});
expressRoot.disable("x-powered-by").disable("etag");
expressRoot.use(express.json());
expressRoot.use(express.urlencoded({extended: true}));
expressRoot.use(({ res, next }) => { res.json = (body: any) => res.setHeader("Content-Type", "application/json").send(JSON.stringify(body, null, 2)); return next(); });
expressRoot.get("/metrics", async ({res, next}) => Prometheus.register.metrics().then(data => res.set("Content-Type", Prometheus.register.contentType).send(data)).catch(err => next(err)));
expressRoot.use((req, _, next) => {requests.inc({method: req.method, path: req.path, from: !(req.socket.remoteAddress&&req.socket.remotePort)?"socket":req.protocol});next();});
expressRoot.use(expressRateLimit({skipSuccessfulRequests: true, message: "Already reached the limit, please wait a few moments", windowMs: (1000*60)*2, max: 1500}));
if (process.env.BDSD_IGNORE_KEY) console.warn("Bdsd ignore auth key!");
expressRoot.use(async (req, res, next) => {
  // Allow by default socket
  if (!req.socket.remoteAddress && !req.socket.remotePort) {
    res.setHeader("AuthSocket", "true");
    return next();
  }

  // External requests
  if (process.env.BDSD_IGNORE_KEY) return next();
  if (!fs.existsSync(bdsdAuth)) {
    if (!fs.existsSync(bdsCore.platformPathManeger.bdsRoot)) await fsPromise.mkdir(bdsCore.platformPathManeger.bdsRoot, {recursive: true});
    const keys = crypto.generateKeyPairSync("rsa", {modulusLength: 4096, publicKeyEncoding: {type: "spki", format: "pem"}, privateKeyEncoding: {type: "pkcs8", format: "pem", cipher: "aes-256-cbc", passphrase: crypto.randomBytes(128).toString("hex")}});
    await fsPromise.writeFile(bdsdAuth, JSON.stringify(keys, null, 2));
    console.log("Bdsd Keys\nPublic base64: '%s'\n\npublic:\n%s", Buffer.from(keys.publicKey).toString("base64"), keys.publicKey);
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

// Listen socks
expressRoot.listen(sockListen, function () {console.info("Socket listen on '%s'", this.address());});
if (process.env.PORT) expressRoot.listen(process.env.PORT, () => console.info("HTTP listen on http://127.0.0.1:%s", process.env.PORT));

let timesBefore = os.cpus().map(c => c.times);
function getAverageUsage() {
  let timesAfter = os.cpus().map(c => c.times);
  let timeDeltas = timesAfter.map((t, i) => ({
    user: t.user - timesBefore[i].user,
    sys: t.sys - timesBefore[i].sys,
    idle: t.idle - timesBefore[i].idle
  }));
  timesBefore = timesAfter;
  return Math.floor(timeDeltas.map(times => 1 - times.idle / (times.user + times.sys + times.idle)).reduce((l1, l2) => l1 + l2) / timeDeltas.length*100);
}

expressRoot.get("/", ({res}) => {
  return res.status(200).json({
    platform: process.platform,
    arch: process.arch,
    cpu: {
      avg: getAverageUsage(),
      cores: os.cpus().length,
    },
  });
});

// v1 routes
expressRoot.use("/v1", app);

// Send Sessions
app.get("/", ({res}) => res.json(Object.keys(bdsCore.globalPlatfroms.internalSessions).map(key => {
  return {
    id: bdsCore.globalPlatfroms.internalSessions[key].id,
    platform: bdsCore.globalPlatfroms.internalSessions[key].platform,
    serverStarted: bdsCore.globalPlatfroms.internalSessions[key].serverStarted,
    portListen: bdsCore.globalPlatfroms.internalSessions[key].portListening,
    playerActions: bdsCore.globalPlatfroms.internalSessions[key].playerActions,
  };
})));

// Install server
app.put("/server", async (req, res, next) => {
  try {
  if (!req.body||Object.keys(req.body).length === 0) return res.status(400).json({
    error: "Body is empty"
  });
  const action = req.body.action as "install"|"start";
  const platform = req.body.platform as bdsCore.platformPathManeger.bdsPlatform;
  if (action === "install" && req.body.version === undefined) req.body.version = "latest";

  if (platform === "bedrock") {
    if (action === "install") return res.json(await bdsCore.Bedrock.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.Bedrock.startServer(req.body.platformOptions);
      return res.json({
        id: platform.id
      });
    }
  } else if (platform === "pocketmine") {
    if (action === "install") return res.json(await bdsCore.PocketmineMP.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.PocketmineMP.startServer(req.body.platformOptions);
      return res.json({
        id: platform.id
      });
    }
  } else if (platform === "java") {
    if (action === "install") return res.json(await bdsCore.Java.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.Java.startServer(req.body.javaOptions);
      return res.json({
        id: platform.id
      });
    }
  } else if (platform === "paper") {
    if (action === "install") return res.json(await bdsCore.PaperMC.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.PaperMC.startServer(req.body.javaOptions);
      return res.json({
        id: platform.id
      });
    }
  } else if (platform === "spigot") {
    if (action === "install") return res.json(await bdsCore.Spigot.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.Spigot.startServer(req.body.javaOptions);
      return res.json({
        id: platform.id
      });
    }
  } else if (platform === "powernukkit") {
    if (action === "install") return res.json(await bdsCore.Powernukkit.installServer(req.body.version, req.body.platformOptions));
    else if (action === "start") {
      const platform = await bdsCore.Powernukkit.startServer(req.body.javaOptions);
      return res.json({
        id: platform.id
      });
    }
  }} catch(err) {
    return next(err);
  }

  return res.status(400).json({
    error: "Invalid action"
  });
});

app.get("/log/:id", (req, res) => {
  const session = bdsCore.globalPlatfroms.internalSessions[req.params.id];
  if (!session) return res.status(400).json({error: "Session ID not exists!"});
  res.status(200);
  if (session.serverCommand.options?.logPath?.stdout) fs.createReadStream(session.serverCommand.options.logPath.stdout, {autoClose: false, emitClose: false}).on("data", data => res.write(data));
  session.events.on("log", data => res.write(Buffer.from(data+"\n")));
  session.events.once("exit", () => {if (res.closed) res.end()});
  return res;
});

app.put("/command/:id", (req, res) => {
  const session = bdsCore.globalPlatfroms.internalSessions[req.params.id];
  if (!session) return res.status(400).json({error: "Session ID not exists!"});
  session.runCommand(req.body?.command);
  return res;
});

app.get("/stop/:id", (req, res, next) => {
  const session = bdsCore.globalPlatfroms.internalSessions[req.params.id];
  if (!session) return res.status(400).json({error: "Session ID not exists!"});
  return session.stopServer().then(exitCode => res.status(200).json({exitCode})).catch(err => next(err));
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