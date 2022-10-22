import path from "path";
import { readdirrecursive, exists, isFile, isDirectory } from "../../src/lib/extendsFs";

describe("Extend FS", function(){
  this.timeout(Infinity);
  it("List files/dirs recursive without info", async () => readdirrecursive(path.resolve(__dirname, "../../src")).then(res => typeof res[0] === "string"?null:Promise.reject(new Error("Invalid dir return"))));
  it("List files/dirs recursive with info", async () => readdirrecursive([path.resolve(__dirname, "../../src"), __dirname], true));
  it("Exists", async () => exists(__filename).then(res => res?null:Promise.reject(new Error("Invalid return this file"))));
  it("Is file", async () => isFile(__filename).then(res => res?null:Promise.reject(new Error("Invalid return this file"))));
  it("Is directory", async () => isDirectory(__dirname).then(res => res?null:Promise.reject(new Error("Invalid return this folder"))));
});