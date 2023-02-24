import express from "express";
import bdsCore, { serverRun } from "@the-bds-maneger/core";

const app = express.Router();
export default app;
export const sessions: {[key: string]: serverRun} = {};

app.get("/", ({res}) => res.json(Object.keys(sessions).reduce((acc, key) => {
  acc[key] = {
    id: sessions[key].runOptions.paths.id,
    ports: sessions[key].portListening,
  };
  return acc;
}, {})));

app.post("/:sessionID", (req, res) => {
  const session = sessions[req.params.sessionID];
  if (!session) return res.status(400).json({
    message: "Session no exists or not running"
  });
  res.json({action: "piped"});
  return session.sendCommand(req);
});

app.put("/", async (req, res) => {
  const { platform, altServer, ID, newID, allowBeta } = req.body ?? {};
  if (!platform) return res.status(400).json({message: "Required platform server"});
  if (newID) {
    if (platform === "bedrock") {
      const { id, version, releaseDate } = await bdsCore.Bedrock.installServer({
        newID: true,
        altServer,
        allowBeta: (["true", "on", "yes"]).includes(allowBeta),
      });
      return res.json({id, version, releaseDate});
    }
    const { id, version } = await bdsCore.Java.installServer({
      newID: true,
      altServer
    });
    return res.json({id, version});
  }
  if (sessions[ID]) return res.status(304).json({
    created: false,
    id: ID,
  });
  if (platform === "bedrock") {
    const session = await bdsCore.Bedrock.startServer({
      newID: false,
      altServer,
      ID
    });
    sessions[ID] = session;
  } else {
    const session = await bdsCore.Java.startServer({
      newID: false,
      altServer,
      ID
    });
    sessions[ID] = session;
  }
  sessions[ID].once("close", () => delete sessions[ID]);
  return res.json({
    created: true,
    id: ID,
  });
});