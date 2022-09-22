import { tmpdir } from "node:os";
import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import got from "got";
import tar from "tar";

export async function saveFile(url: string, options?: {filePath?: string, headers?: {[key: string]: string|number}}) {
  let fileSave = path.join(tmpdir(), "bdscore_"+(Math.random()*155515151).toFixed()+"_raw_bdscore_"+path.basename(url));
  const Headers = {};
  if (options) {
    if (options.filePath && typeof options.filePath === "string") fileSave = options.filePath;
    if (options.headers) Object.keys(options.headers).forEach(key => Headers[key] = String(options.headers[key]));
  }

  const gotStream = got.stream({url, headers: Headers, isStream: true});
  gotStream.pipe(fs.createWriteStream(fileSave, {autoClose: false}));
  await new Promise<void>((done, reject) => {
    gotStream.on("end", () => setTimeout(done, 1000));
    gotStream.on("error", reject);
  });
  return fileSave;
}

export async function tarExtract(url: string, options?: {folderPath?: string, headers?: {[key: string]: string|number}}) {
  let fileSave = path.join(tmpdir(), "_bdscore", (Math.random()*155515151).toFixed()+"_raw_bdscore");
  const Headers = {};
  if (options) {
    if (options.folderPath && typeof options.folderPath === "string") fileSave = options.folderPath;
    if (options.headers) Object.keys(options.headers).forEach(key => Headers[key] = String(options.headers[key]));
  }

  if (!fs.existsSync(fileSave)) await fs.promises.mkdir(fileSave, {recursive: true});
  const gotStream = got.stream({url, headers: Headers, isStream: true});
  const tarE = tar.extract({cwd: fileSave, noChmod: false, noMtime: false, preserveOwner: true});
  gotStream.pipe(tarE);
  return new Promise<string>((done, reject) => {
    gotStream.on("end", () => done(fileSave));
    gotStream.on("error", reject);
    tarE.on("error", reject);
  });
}

export async function getBuffer(url: string, options?: {method?: string,body?: any, headers?: {[key: string]: string}}): Promise<Buffer> {
  const Headers = {};
  let Body: any;
  if (options) {
    if (options.headers) Object.keys(options.headers).forEach(key => Headers[key] = options.headers[key]);
    if (options.body) Body = options.body;
  }
  // if (typeof fetch === "undefined")
  return axios.get(url, {
    responseEncoding: "arraybuffer",
    responseType: "arraybuffer",
    headers: Headers,
    data: Body,
    method: (options?.method||"GET").toUpperCase()
  }).then(({data}) => Buffer.from(data));
  // return fetch(url, {
  //   method: "GET",
  //   body: typeof Body === "object" ? JSON.stringify(Body, null, 2):Body,
  //   headers: Headers
  // }).then(res => res.arrayBuffer()).then(res => Buffer.from(res));
}

export async function getJSON<JSONReturn = any>(url: string, options?: {method?: string, body?: any, headers?: {[key: string]: string}}): Promise<JSONReturn> {
  return getBuffer(url, {
    body: options?.body,
    headers: options?.headers,
    method: options?.method
  }).then(res => JSON.parse(res.toString("utf8")) as JSONReturn);
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

export async function GithubRelease(username: string, repo?: string): Promise<githubRelease[]> {
  let fullRepo = username;
  if (!username) throw new Error("Repository is required, example: GithubRelease(\"Username/repo\") or GithubRelease(\"Username\", \"repo\")");
  if (repo) {
    if (!/\//.test(fullRepo)) fullRepo += "/"+repo;
  }
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
export async function githubTree(username: string, repo: string, tree: string) {
  return getJSON<githubTree>(`https://api.github.com/repos/${username}/${repo}/git/trees/${tree}?recursive=true`);
}