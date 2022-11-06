import stream from "node:stream";
import { getJSON, pipeFetch } from "../../src/request/simples";
import { saveFile } from "../../src/request/large";
import { GithubRelease, githubTree } from "../../src/request/github";
import { getExternalIP } from "../../src/request/client";

describe("HTTP Request", function(){
  this.timeout(Infinity);
  const Stream = new stream.Writable({write(_chunk, _encoding, callback) {callback()}});
  it("External IP", async () => getExternalIP());
  it("Github Releases", async () => GithubRelease("The-Bds-Maneger", "Bds-Maneger-Core"));
  it("Github Tree", async () => githubTree("The-Bds-Maneger", "Bds-Maneger-Core"));
  it("JSON", async () => getJSON("https://raw.githubusercontent.com/The-Bds-Maneger/Bds-Maneger-Core/main/package.json"));
  it("Stream", async () => pipeFetch({stream: Stream, url: "https://raw.githubusercontent.com/The-Bds-Maneger/Bds-Maneger-Core/main/package.json"}));
  it("Save File", async () => saveFile("https://raw.githubusercontent.com/The-Bds-Maneger/Bds-Maneger-Core/main/package.json"));
});
