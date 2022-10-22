import { Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
export default {exists, isDirectory, isFile, readdirrecursive};
export async function exists(filePath: string) {
  return fs.access(path.resolve(filePath)).then(() => true).catch(() => false);
}

export async function isDirectory(filePath: string) {
  try {
    return (await fs.lstat(filePath)).isDirectory();
  } catch {
    return false;
  }
}

export async function isFile(filePath: string) {
  try {
    return (await fs.lstat(filePath)).isFile();
  } catch {
    return false;
  }
}

export type dirRecursive = {path: string, stat: Stats};
export async function readdirrecursive(filePath: string|string[], returnInfo = false): Promise<(dirRecursive|string)[]> {
  if (typeof filePath === "object") return Promise.all(filePath.map(folder => readdirrecursive(folder, returnInfo))).then(returnArray => {
    const files: ((typeof returnArray)[0]) = [];
    for (const folderInfo of returnArray) files.push(...folderInfo);
    return files;
  });

  if (!(await exists(filePath))) throw new Error("Folder not exists");
  const resolvedPath = path.resolve(filePath);
  if (!await isDirectory(resolvedPath)) throw new Error("path if not directory");
  const dirfiles = (await fs.readdir(resolvedPath)).map(file => path.join(resolvedPath, file));
  for (const folder of dirfiles) {
    if (await isFile(folder)) continue;
    await readdirrecursive(folder, false).then(files => dirfiles.push(...files as string[])).catch(err => err);
  }
  if (returnInfo) return Promise.all(dirfiles.map(async file => typeof file === "string"?fs.lstat(file).then(stat => ({ path: file, stat })):file));
  return dirfiles;
}