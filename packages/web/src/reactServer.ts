import _next from "next";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const next: typeof _next.default = _next as any;
let _require: typeof require;
if (typeof require === "function") _require = require; else _require = (await import("module")).default.createRequire(import.meta.url);
export const dev = import.meta.url.endsWith(".ts"), { PORT = "3000", HOSTNAME = "localhost" } = process.env;

const dir = path.join(__dirname, "next");
export const nextApp = next({
  customServer: true,
  hostname: HOSTNAME,
  quiet: true,
  port: Number(PORT),
  conf: _require(path.join(dir, "next.config.cjs")),
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