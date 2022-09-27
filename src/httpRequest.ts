import { tmpdir } from "node:os";
import fs from "node:fs";
import path from "node:path";
import tar from "tar";
import AdmZip from "adm-zip";

let got: (typeof import("got"))["default"];
const gotCjs = async () => got||(await (eval('import("got")') as Promise<typeof import("got")>)).default;
gotCjs().then(res => got = res);

export async function saveFile(url: string, options?: {filePath?: string, headers?: {[key: string]: string|number}}) {
  const Headers = {};
  let fileSave = path.join(tmpdir(), Date.now()+"_raw_bdscore_"+path.basename(url));
  if (options) {
    if (options.filePath && typeof options.filePath === "string") fileSave = options.filePath;
    if (options.headers) Object.keys(options.headers).forEach(key => Headers[key] = String(options.headers[key]));
  }

  const fsStream = fs.createWriteStream(fileSave, {autoClose: false});
  const gotStream = (await gotCjs()).stream({url, headers: Headers, isStream: true});
  gotStream.pipe(fsStream);
  await new Promise<void>((done, reject) => {
    gotStream.on("error", reject);
    fsStream.on("error", reject);
    gotStream.once("end", () => fsStream.once("finish", done));
  });
  return fileSave;
}

export async function getBuffer(url: string, options?: {method?: string,body?: any, headers?: {[key: string]: string}}): Promise<Buffer> {
  const Headers = {};
  let Body: any;
  if (options) {
    if (options.headers) Object.keys(options.headers).forEach(key => Headers[key] = options.headers[key]);
    if (options.body) Body = options.body;
  }
  return (await gotCjs())(url, {
    headers: Headers,
    body: Body,
    method: (options?.method||"GET").toUpperCase() as any,
    responseType: "buffer"
  }).then(({body}) => Buffer.from(body));
}

export async function tarExtract(url: string, options?: {folderPath?: string, headers?: {[key: string]: string|number}}) {
  let fileSave = path.join(tmpdir(), "_bdscore", Date.now()+"_raw_bdscore");
  const Headers = {};
  if (options) {
    if (options.folderPath && typeof options.folderPath === "string") fileSave = options.folderPath;
    if (options.headers) Object.keys(options.headers).forEach(key => Headers[key] = String(options.headers[key]));
  }

  if (!fs.existsSync(fileSave)) await fs.promises.mkdir(fileSave, {recursive: true});
  const gotStream = (await gotCjs()).stream({url, headers: Headers, isStream: true});
  const tarE = tar.extract({
    cwd: fileSave,
    noChmod: false,
    noMtime: false,
    preserveOwner: true,
    keep: true,
    p: true
  });
  gotStream.pipe(tarE);
  return new Promise<string>((done, reject) => {
    gotStream.on("end", () => done(fileSave));
    gotStream.on("error", reject);
    tarE.on("error", reject);
  });
}

const isGithubRoot = /github.com\/[\S\w]+\/[\S\w]+\/archive\//;
export async function extractZip(url: string, folderTarget: string) {
  const downloadedFile = await saveFile(url);
  const extract = async (targetFolder: string) => {
    const zip = new AdmZip(downloadedFile);
    await new Promise<void>((done, reject) => {
      zip.extractAllToAsync(targetFolder, true, true, (err) => {
        if (err) return done();
        return reject(err);
      })
    });
  }
  if (isGithubRoot.test(url)) {
    const tempFolder = await fs.promises.mkdtemp(path.join(tmpdir(), "githubRoot_"), "utf8");
    await extract(tempFolder);
    const files = await fs.promises.readdir(tempFolder);
    if (files.length === 0) throw new Error("Invalid extract");
    console.log("%s -> %s", path.join(tempFolder, files[0]), folderTarget)
    await fs.promises.cp(path.join(tempFolder, files[0]), folderTarget, {recursive: true, force: true, preserveTimestamps: true, verbatimSymlinks: true});
    return await fs.promises.rm(tempFolder, {recursive: true, force: true});
  }
  return extract(folderTarget);
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
export async function githubTree(username: string, repo: string, tree: string = "main") {
  const validate = /^[a-zA-Z0-9_\-]+$/;
  if (!validate.test(username)) throw new Error("Invalid username");
  if (!validate.test(repo)) throw new Error("Invalid repository name");
  return getJSON<githubTree>(`https://api.github.com/repos/${username}/${repo}/git/trees/${tree}?recursive=true`);
}