import _next, { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const next: typeof _next.default = _next as any;
let _require: typeof require;
if (typeof require === "function") _require = require; else _require = (await import("module")).default.createRequire(import.meta.url);
export const dev = import.meta.url.endsWith(".ts"), { HOSTNAME = "localhost" } = process.env;

const dir = path.join(__dirname, "next");
const nextConfig: NextConfig = _require(path.join(dir, "next.config.cjs"));
nextConfig.env ||= {};
nextConfig.env.SERVER_PORT = String(config.port)

export const nextApp = next({
  customServer: true,
  hostname: HOSTNAME,
  quiet: true,
  port: config.port,
  conf: nextConfig,
  dir,
  dev,
});

await nextApp.prepare();
export const nextHandler = nextApp.getRequestHandler();
export const nextUpgarde = nextApp.getUpgradeHandler();
export const {
  render: pageRender,
  render404,
  renderError,
} = nextApp;