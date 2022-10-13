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

export async function readdirrecursive(filePath: string|string[]): Promise<string[]> {
  if (Array.isArray(filePath)) {
    const filesStorage: string[] = [];
    await Promise.all(filePath.map(files => readdirrecursive(files).then(res => filesStorage.push(...res)).catch(() => null)));
    return filesStorage;
  }
  if (!(await exists(filePath))) throw new Error("Folder not exists");
  filePath = path.resolve(filePath);
  if (!await isDirectory(filePath)) throw new Error("path if not directory");
  const dirfiles = (await fs.readdir(filePath)).map(file => path.join(filePath as string, file));
  for (const folder of dirfiles) {
    if (await isFile(folder)) continue;
    dirfiles.push(...(await readdirrecursive(folder).catch(() => [])));
  }
  return dirfiles;
}