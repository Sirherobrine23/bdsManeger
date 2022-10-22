import type { Method } from "got";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import tar from "tar";
import AdmZip from "adm-zip";
import stream from "node:stream";
import { exists } from "./extendsFs";

let got: (typeof import("got"))["default"];
const gotCjs = async () => got||(await (eval('import("got")') as Promise<typeof import("got")>)).default.extend({enableUnixSockets: true});
gotCjs().then(res => got = res);

export type requestOptions = {
  url?: string,
  socket?: {
    socketPath: string,
    path?: string,
  }
  method?: Method,
  headers?: {[headerName: string]: string[]|string},
  body?: any,
};

export async function pipeFetch(options: requestOptions & {stream: fs.WriteStream|stream.Writable, waitFinish?: boolean}) {
  if (!(options?.url||options?.socket)) throw new Error("Host blank")
  const urlRequest = (typeof options.url === "string")?options.url:`http://unix:${options.socket.socketPath}:${options.socket.path||"/"}`;
  const gotStream = (await gotCjs()).stream(urlRequest, {
    isStream: true,
    headers: options.headers||{},
    method: options.method||"GET",
    json: options.body,
  });
  await new Promise<void>((done, reject) => {
    gotStream.pipe(options.stream);
    options.stream.on("error", reject);
    gotStream.on("error", reject);
    gotStream.once("end", () => {
      if (options.waitFinish) return options.stream.once("finish", done);
      return done();
    });
  });
}

export async function bufferFetch(options: string|requestOptions) {
  if (typeof options === "string") options = {url: options};
  if (!(options.url||options.socket)) throw new Error("Host blank")
  const urlRequest = (typeof options.url === "string")?options.url:`http://unix:${options.socket.socketPath}:${options.socket.path||"/"}`;
  return (await gotCjs())(urlRequest, {
    headers: options.headers||{},
    method: options.method||"GET",
    json: options.body,
    responseType: "buffer",
  }).then(res => ({headers: res.headers, data: Buffer.from(res.body), response: res}));
}

export async function getJSON<JSONReturn = any>(request: string|requestOptions): Promise<JSONReturn> {
  if (typeof request === "string") request = {url: request};
  const res = (await bufferFetch(request)).data.toString("utf8");
  return JSON.parse(res) as JSONReturn;
}

export async function saveFile(request: string|requestOptions & {filePath?: string}) {
  if (typeof request === "string") request = {url: request};
  const filePath = request.filePath||path.join(os.tmpdir(), `raw_bdscore_${Date.now()}_${(path.parse(request.url||request.socket?.path||crypto.randomBytes(16).toString("hex"))).name}`);
  await pipeFetch({...request, waitFinish: true, stream: fs.createWriteStream(filePath, {autoClose: false})});
  return filePath;
}

export async function tarExtract(request: requestOptions & {folderPath?: string}) {
  const folderToExtract = request.folderPath||path.join(os.tmpdir(), `raw_bdscore_${Date.now()}_${(path.parse(request.url||request.socket?.path||crypto.randomBytes(16).toString("hex"))).name}`);
  if (!await exists(folderToExtract)) await fs.promises.mkdir(folderToExtract, {recursive: true});
  await pipeFetch({
    ...request,
    waitFinish: true,
    stream: tar.extract({
      cwd: folderToExtract,
      noChmod: false,
      noMtime: false,
      preserveOwner: true,
      keep: true,
      p: true
    })
  });
  return folderToExtract
}

const githubAchive = /github.com\/[\S\w]+\/[\S\w]+\/archive\//;
export async function extractZip(request: requestOptions & {folderTarget: string}) {
  const zip = new AdmZip(await saveFile(request));
  const targetFolder = githubAchive.test(request.url)?await fs.promises.mkdtemp(path.join(os.tmpdir(), "githubRoot_"), "utf8"):request.folderTarget;
  await new Promise<void>((done, reject) => {
    zip.extractAllToAsync(targetFolder, true, true, (err) => {
      if (!err) return done();
      return reject(err);
    })
  });

  if (githubAchive.test(request.url)) {
    const files = await fs.promises.readdir(targetFolder);
    if (files.length === 0) throw new Error("Invalid extract");
    await fs.promises.cp(path.join(targetFolder, files[0]), request.folderTarget, {recursive: true, force: true, preserveTimestamps: true, verbatimSymlinks: true});
    return await fs.promises.rm(targetFolder, {recursive: true, force: true});
  }
  return;
}

export type testIp<protocolType extends "ipv4"|"ipv6" = "ipv4"> = {
  ip: string,
  type: protocolType,
  subtype: string,
  via: string,
  padding: string,
  asn: string,
  asnlist: string,
  asn_name: string,
  country: string,
  protocol: "HTTP/2.0"|"HTTP/1.1"|"HTTP/1.0"
};

export async function getExternalIP(): Promise<{ipv4: string, ipv6?: string, rawRequest?: {ipv4: testIp<"ipv4">, ipv6?: testIp<"ipv6">}}> {
  const ipv6: testIp<"ipv6"> = await getJSON("https://ipv6.lookup.test-ipv6.com/ip/").catch(() => undefined);
  const ipv4: testIp<"ipv4"> = await getJSON("https://ipv4.lookup.test-ipv6.com/ip/");
  return {
    ipv4: ipv4.ip,
    ipv6: ipv6?.ip,
    rawRequest: {ipv4, ipv6}
  };
}

export type githubRelease = {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  tarball_url: string;
  zipball_url: string;
  body: string;
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: Array<{
    url: string;
    id: number;
    node_id: string;
    name: string;
    label: string;
    content_type: string;
    state: string;
    size: number;
    download_count: number;
    created_at: string;
    updated_at: string;
    browser_download_url: string;
    uploader: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
  }>;
};

export async function GithubRelease(username: string, repo: string, releaseTag: string): Promise<githubRelease>;
export async function GithubRelease(username: string, repo: string): Promise<githubRelease[]>;
export async function GithubRelease(username: string): Promise<githubRelease[]>;
export async function GithubRelease(username: string, repo?: string, releaseTag?: string): Promise<githubRelease|githubRelease[]> {
  let fullRepo = username;
  if (!username) throw new Error("Repository is required, example: GithubRelease(\"Username/repo\") or GithubRelease(\"Username\", \"repo\")");
  if (repo) {
    if (!/\//.test(fullRepo)) fullRepo += "/"+repo;
  }
  if (releaseTag) return getJSON<githubRelease>(`https://api.github.com/repos/${fullRepo}/releases/tags/${releaseTag}`);
  return getJSON<githubRelease[]>(`https://api.github.com/repos/${fullRepo}/releases?per_page=100`);
}

export type githubTree = {
  "sha": string,
  "url": string,
  "truncated": boolean,
  "tree": {
    "path": string,
    "mode": string,
    "type": "blob"|"tree",
    "sha": string,
    "size": number,
    "url": string
  }[],
};
export async function githubTree(username: string, repo: string, tree: string = "main") {
  const validate = /^[a-zA-Z0-9_\-]+$/;
  if (!validate.test(username)) throw new Error("Invalid username");
  if (!validate.test(repo)) throw new Error("Invalid repository name");
  return getJSON<githubTree>(`https://api.github.com/repos/${username}/${repo}/git/trees/${tree}?recursive=true`);
}
