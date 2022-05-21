import { promises as fsPromise } from "fs";
import path from "path";

export default async function Readdir(pathRead: string, filter: Array<RegExp>|RegExp) {
  if (!(Array.isArray(filter))) filter = [filter];
  const fixedPath = path.resolve(pathRead);
  const files: Array<{
    path: string,
    name: string
  }> = [];
  for (const file of await fsPromise.readdir(fixedPath)) {
    const FullFilePath = path.join(fixedPath, file);
    const stats = await fsPromise.stat(FullFilePath);
    if (stats.isDirectory()) files.push(...(await Readdir(FullFilePath, filter)));
    else if (stats.isSymbolicLink()) {
      const realPath = await fsPromise.realpath(FullFilePath);
      const statsSys = await fsPromise.stat(realPath);
      if (statsSys.isDirectory()) files.push(...(await Readdir(realPath, filter)));
      else {
        if (filter.length === 0||filter.some(x => x.test(realPath))) files.push({
          path: FullFilePath,
          name: path.basename(FullFilePath)
        });
      }
    } else {
      if (filter.length === 0||filter.some(x => x.test(FullFilePath))) files.push({
        path: FullFilePath,
        name: path.basename(FullFilePath)
      });
    }
  }
  return files;
}