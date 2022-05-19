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

/**
 *
 * @param {Array<{filePath: string, funcs: {name?: string, depends?: string|Array<string>}}>} Files
 */
async function runTest(Files) {
  // return console.log(Files);
  for (const {filePath: file, funcs: main} of Files) {
    const logFile = path.join(testDir, file.replace(path.join(__dirname, "dist/cjs"), "").replace(/\/|\\/gi, "_").replace(/\.test\.[tj]s$/, "").replace(/^_/, ""), "");
    const log = [];
    try {
      for (const func of Object.keys(main).filter(key => typeof main[key] === "function")) {
        try {
          const Data = await main[func]();
          if (process.argv.includes("--show-return")) console.log(`${file}#${func}: %o`, Data);
          log.push({
            funcName: func,
            log: Data||{}
          });
        } catch (err) {
          log.push({
            funcName: func,
            err: String(err)
          });
          console.error(err);
          if (process.argv.includes("--exit-on-error")) throw err;
        }
        fs.writeFileSync(logFile+".json", JSON.stringify(log, null, 2));
      }
    } catch (err) {
      console.error("Error running file test: %s", file);
      console.error(err);
      console.error();
      fs.writeFileSync(logFile+".error.json", String(err.stack||err));
      if (process.argv.includes("--exit-on-error")) throw err;
    }
  }
}

if (fs.existsSync(path.join(__dirname, "dist"))) fs.rmSync(path.join(__dirname, "dist"), {recursive: true, force: true});
console.log("Building project");
execSync("npm run build:cjs", { stdio: "inherit" });
readdirRecursive(path.join(__dirname, "dist/cjs"), [/\.test\.js$/]).then(res => {
  /** @type {Array<{filePath: string, funcs: {name?: string, depends?: string}}>} */
  let __Sortted = res.map(x => ({filePath: x, funcs: require(x)})).sort((a, b) => {
    if (!a.funcs.name) return -1;
    if (!b.funcs.depends) return -1;
    if (a.funcs.name === b.funcs.depends) return 1;
    else return 0;
  }).reverse();
  return __Sortted;
}).then(runTest).then(() => {console.log("Done"); process.exit(0);}).catch(err => {
  console.log("Error running tests");
  console.log(err);
  process.exit(1);
});