#!/usr/bin/env node
import express from "express";
import http from "node:http";
import { cookie } from "./auth.js";
import { localConfig } from "./config.js";
import mcserver from "./mcserver.js";
import { nextHandler, nextUpgarde } from "./reactServer.js";

const app = express();
const server = http.createServer();
server.on("upgrade", nextUpgarde);
server.on("request", app);

app.disable("etag").disable("x-powered-by");
app.use(cookie, express.json(), express.urlencoded({ extended: true }));

// API 404
app.use("/api/mcserver", mcserver);
app.use("/api", ({res}) => res.status(404).json({error: "endpoint not exists!"}));

// Page render
app.all("*", (req, res) => nextHandler(req, res));

// 500 error
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err?.message || err })
});

// Server listen
server.listen(localConfig.portListen, () => {
  const addr = server.address();
  console.log("HTTP Listen on %s", typeof addr === "object" ? addr.port : addr);
});