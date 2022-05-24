#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const testDir = path.join(__dirname, ".testDir");
if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
fs.mkdirSync(testDir);

/**
 * Read dir recursively
 *
 * @param {string} dir
 * @param {Array<RegExp>} filterFile
 * @returns {Promise<Array<string>>}
 */
async function readdirRecursive(dir, filterFile) {
  if (!fs.existsSync(dir)) throw new Error(`Directory not found: ${dir}`);
  if (!(fs.statSync(dir).isDirectory())) return [dir];
  if (!filterFile) filterFile = [];
  /** @type {Array<string>} */
  const files = [];
  /** @type {Array<string>} */
  const dirs = fs.readdirSync(dir);
  for (const d of dirs) {
    const dirPath = path.resolve(dir, d);
    if (fs.statSync(dirPath).isDirectory()) files.push(...(await readdirRecursive(dirPath, filterFile)));
    else {
      if (filterFile.length <= 0) files.push(dirPath);
      else {
        if (filterFile.some(f => f.test(d))) files.push(dirPath);
      }
    }
  }
  return files;
}

if (fs.existsSync(path.join(__dirname, "dist"))) fs.rmSync(path.join(__dirname, "dist"), {recursive: true, force: true});
console.log("Building project");
execSync("npm run build:cjs", { stdio: "inherit" });

(async function() {
  /** @type {Array<{filePath: string, funcs: {name?: string, depends?: string}}>} */
  const Files = await readdirRecursive(path.join(__dirname, "dist/cjs"), [/\.test\.js$/]).then(res => res.map(x => ({filePath: x, funcs: require(x)})));
  const Sort = [];
  while (Files.length > 0) {
    const File = Files.shift();
    if (!File.funcs.depends||!File.funcs.name) Sort.push(File);
    else {
      const depends = File.funcs.depends;
      if (Sort.some(f => f.funcs.name === depends)) Sort.push(File);
      else Files.push(File);
    }
  }
  // return console.log(Sort);
  for (const {filePath: file, funcs: main} of Sort) {
    const logFile = path.join(testDir, file.replace(path.join(__dirname, "dist/cjs"), "").replace(/\/|\\/gi, "_").replace(/\.test\.[tj]s$/, "").replace(/^_/, ""), "");
    const log = [];
    for (const func of Object.keys(main).filter(key => typeof main[key] === "function")) {
      const Data = await main[func]();
      console.log(`${file}#${func}: %o`, Data);
    }
    fs.writeFileSync(logFile+".json", JSON.stringify(log, null, 2));
  }
})();