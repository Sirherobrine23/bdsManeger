import * as fs from "node:fs/promises";
import * as fsOld from "node:fs";
import * as path from "node:path";

async function readDirAndFilter(dir: string, test: Array<RegExp> = [/.*/]) {
  if (!(fsOld.existsSync(dir))) throw new Error(`${dir} does not exist`);
  const files = await fs.readdir(dir);
  const parseFiles: Array<string> = []
  await Promise.all(files.map(async (fd) => {
    const stat = await fs.stat(path.join(dir, fd));
    if (stat.isDirectory()) return readDirAndFilter(path.join(dir, fd), test).then(res => parseFiles.push(...res)).catch(err => console.error(err));
    else if (stat.isFile()) {
      const match = test.some(reg => reg.test(fd));
      if (match) parseFiles.push(path.join(dir, fd));
    }
  }));
  return parseFiles;
}

async function runTest() {
  const mainFind = path.join(process.cwd(), "src");
  const testsFiles = await readDirAndFilter(mainFind, [/.*\.test\.ts$/]);
  for (const file of testsFiles) {
    console.log("************** Start Script: %s **************", file);
    const testScript = await import(file) as {[key: string]: () => Promise<void>};
    if (!!testScript.default) {
      console.log("************** Start Test: %s **************", file);
      await testScript.default();
    }
    for (const key in testScript) {
      if (key === "default") continue;
      console.log("************** Start Test: %s **************", key);
      await testScript[key]();
    }
    console.log("************** End Script: %s **************", file);
  }
}

runTest().then(() => {
  console.log("Test passed");
  process.exitCode = 0;
}).catch((err: Error) => {
  console.error("Test failed");
  console.error(err);
  process.exitCode = 1;
}).then(() => {
  console.log("Exit with code: %d", process.exitCode);
  return process.exit();
});