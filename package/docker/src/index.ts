#!/usr/bin/env node
import express from "express";
import expressLayer from "express/lib/router/layer.js";
import v1 from "./v1.js";

// Patch express handler
expressLayer.prototype.handle_request = async function handle_request_promised(...args) {
  var fn = this.handle;
  if (fn.length > 3) return args.at(-1)();
  await Promise.resolve().then(() => fn.call(this, ...args)).catch(args.at(-1));
}

// function unmask(encodedBuffer: Buffer, maskKey: Buffer) {
//   const decoded = Uint8Array.from(encodedBuffer, (element, index) => element ^ maskKey[index % 4])
//   return Buffer.from(decoded)
// }

const app = express();
app.use(express.json(), express.urlencoded({extended: true}), (req, res, next) => {
  req.res.json = res.json = (body: any) => Object.assign(Promise.resolve(body).then(body => res.setHeader("Content-Type", "application/json").send(JSON.stringify(body, (key, value) => {
    if (typeof value === "bigint") return value.toString();
    return value;
  }, 2))).catch(next), res);
  next();
});

// Page info
app.get("/", async ({res}) => {
  return res.json({
    platform: process.platform,
    arch: process.arch,
  });
});

// V1
app.use("/v1", v1);

// 404 and error page
app.all("*", (_req, res) => {
  return res.status(404).json({
    message: "Page or Endpoint not exists"
  });
});
app.use((err, _req, res, _next) => {
  if (!res.writable) return null;
  return res.status(500).json({
    message: err?.message||String(err),
    raw: Object.getOwnPropertyNames(err).reduce((acc, key) => {
      acc[key] = err[key];
      return acc;
    }, {})
  });
});

app.listen(3000, () => console.log("Listen on http://localhost:3000"));