import express from "express";
import { random } from "./auth.js";
import { mongoDatabase } from "./databaseConnect.js";
import bdsCore from "@the-bds-maneger/core";
import path from "node:path";
import { localConfig } from "./config.js";

type serverStor = {
  /** Unique ID to identify server */
  readonly ID: string;

  readonly platform: `bedrock-${bdsCore.Bedrock.platforms}` | `java-${bdsCore.Java.platform}`;

  public: boolean;

  /** user allowed to modify server */
  usersID: string[];
};

export const serverCollection = mongoDatabase.collection<serverStor>("servers");
export async function generateID() {
  let ID: string;
  while (true) if (!(await serverCollection.findOne({ ID: (ID = random()) }))) break;
  return ID;
}

const app = express.Router();
export default app;

export const serverSessions = new Map<string, bdsCore.Bedrock.Bedrock<any> | bdsCore.Java.Java<any>>();
app.get("/public", (_req, res, next) => serverCollection.find({ public: true }).toArray().then(data => res.json(data.map(v => ({ ID: v.ID, serverPlatform: v.platform }))), next));

app.use((req, res, next) => {
  if (!req.userInfo) return res.status(401).json({ error: "need authorization" });
  return next();
});

app.get("/", (req, res, next) => serverCollection.find({ usersID: [req.session.userID] }).toArray().then(res.json, next));
app.post("/", async (req, res) => {
  if (typeof req.body !== "object") return res.status(400).json({ error: "Require body to install platform" });
  const { version, platform } = req.body as { version?: string | number, platform: serverStor["platform"] };

  if (!platform) return res.status(400).json({ error: "require platform" });
  if (!(([
    "bedrock-mojang",
    "java-mojang",
    "bedrock-pocketmine",
    "bedrock-cloudburst",
    "bedrock-nukkit",
    "bedrock-powernukkit",
    "java-spigot",
    "java-paper",
    "java-cuberite",
    "java-purpur",
    "java-folia",
    "java-glowstone"
  ]).includes(platform))) res.status(400).json({ error: "invalid platform" });
  const ID = await generateID();
  await serverCollection.insertOne({
    ID,
    platform,
    public: false,
    usersID: [
      req.userInfo.userID,
    ]
  });

  const pathInstall = path.join(localConfig.serversPath, ID.split("-").join("_"));
  let serverManeger: bdsCore.Bedrock.Bedrock<any> | bdsCore.Java.Java<any>;
  if (platform === "bedrock-mojang") serverManeger = new bdsCore.Bedrock.Bedrock(pathInstall, "mojang");
  else if (platform === "java-mojang") serverManeger = new bdsCore.Java.Java(pathInstall, "mojang");
  else if (platform === "bedrock-pocketmine") serverManeger = new bdsCore.Bedrock.Bedrock(pathInstall, "pocketmine");
  else if (platform === "bedrock-cloudburst") serverManeger = new bdsCore.Bedrock.Bedrock(pathInstall, "cloudburst");
  else if (platform === "bedrock-nukkit") serverManeger = new bdsCore.Bedrock.Bedrock(pathInstall, "nukkit");
  else if (platform === "bedrock-powernukkit") serverManeger = new bdsCore.Bedrock.Bedrock(pathInstall, "powernukkit");
  else if (platform === "java-spigot") serverManeger = new bdsCore.Java.Java(pathInstall, "spigot");
  else if (platform === "java-paper") serverManeger = new bdsCore.Java.Java(pathInstall, "paper");
  else if (platform === "java-cuberite") serverManeger = new bdsCore.Java.Java(pathInstall, "cuberite");
  else if (platform === "java-purpur") serverManeger = new bdsCore.Java.Java(pathInstall, "purpur");
  else if (platform === "java-folia") serverManeger = new bdsCore.Java.Java(pathInstall, "folia");
  else if (platform === "java-glowstone") serverManeger = new bdsCore.Java.Java(pathInstall, "glowstone");

  await serverManeger.installServer(version);
  return res.json(serverManeger.getVersion(version));
});