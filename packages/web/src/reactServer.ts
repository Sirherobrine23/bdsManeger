import _next, { NextConfig } from "next";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const next: typeof _next.default = _next as any;
let _require = createRequire(import.meta.url);
export const dev = import.meta.url.endsWith(".ts");

const dir = path.join(__dirname, "next");
const nextConfig: NextConfig = _require(path.join(dir, "next.config.cjs"));
nextConfig.env ||= {};

export const nextApp = next({
  customServer: true,
  quiet: true,
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
  renderError
} = nextApp;