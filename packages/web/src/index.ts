#!/usr/bin/env node
import "dotenv/config.js";
import express from "express";
import cookie from "./cookie.js";
import expressLayer from "express/lib/router/layer.js";
import * as nextPage from "./reactServer.js";
import mcserverAPI from "./mcserver.js";
import loginRegisterRoute from "./login.js";

// Patch express promise catch's
expressLayer.prototype.handle_request = async function handle_request_promised(...args) {
  var fn = this.handle;
  if (fn.length > 3) return args.at(-1)();
  await Promise.resolve().then(() => fn.call(this, ...args)).catch(args.at(-1));
}

// Express app
const app = express();

app.disable("etag").disable("x-powered-by");
app.use(cookie, express.json(), express.urlencoded({extended: true}));

// API
app.use("/api/mcserver", mcserverAPI);
app.use(loginRegisterRoute);

// Next request
app.all("*", (req, res) => nextPage.nextHandler(req, res));

// 500 error
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({error: err?.message||err})
});

app.listen(Number(process.env.PORT || "3000"), function() {
  console.log("Server listen on %O", this.address());
  this.on("upgrade", nextPage.nextUpgarde);
});