#!/usr/bin/env node
import "dotenv/config.js";
import express from "express";
import expressLayer from "express/lib/router/layer.js";
import { config } from "./config.js";
import cookie from "./cookie.js";
import loginRegisterRoute from "./login.js";
import mcserverAPI from "./mcserver.js";
import * as nextPage from "./reactServer.js";
import { server as sshServer } from "./ssh.js";

// Patch express promise catch's
expressLayer.prototype.handle_request = async function handle_request_promised(...args) {
  var fn = this.handle;
  if (fn.length > 3) return args.at(-1)();
  await Promise.resolve().then(() => fn.call(this, ...args)).catch(args.at(-1));
}

// Express app
const app = express();

app.disable("etag").disable("x-powered-by");
app.use(cookie, express.json(), express.urlencoded({ extended: true }));

// API
app.use("/api/mcserver", mcserverAPI);
app.use(loginRegisterRoute);

// Next request
app.all("*", (req, res) => nextPage.nextHandler(req, res));

// 500 error
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err?.message || err })
});

app.listen(config.port, function () {
  const addr = this.address();
  console.log("Dashboard/API listen on %O", typeof addr === "object" ? addr.port : Number(addr));
  this.on("upgrade", nextPage.nextUpgarde);
  if (config.sshServer.port >= 0) {
    sshServer.listen(config.sshServer.port, function listenOn() {
      const addr = sshServer.address();
      console.log("SSH listen on %O", typeof addr === "object" ? addr.port : Number(addr));
    });
  }
});