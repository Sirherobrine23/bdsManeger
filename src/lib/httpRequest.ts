import { tmpdir } from "node:os";
import fs from "node:fs";
import path from "node:path";
import type { Method } from "got";
import tar from "tar";
import AdmZip from "adm-zip";
import stream from "node:stream";

let got: (typeof import("got"))["default"];
const gotCjs = async () => got||(await (eval('import("got")') as Promise<typeof import("got")>)).default.extend({enableUnixSockets: true});
gotCjs().then(res => got = res);

export type requestOptions = {
  path?: string,
  url?: string,
  socket?: {path: string, protocoll?: "http"|"https"},
  method?: Method,
  headers?: {[headerName: string]: string[]|string},
  body?: any,
};

export async function pipeFetch(options: requestOptions & {stream: fs.WriteStream|stream.Writable}) {
  if (!(options.url||options.socket)) throw new Error("Enter a url or an (IPC/Unix) socket");
  const urlRequest = (options.url||`${options.socket.protocoll||"http"}://unix:${options.socket.path}:`)+(options.path||"");
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
    gotStream.once("end", () => options.stream.once("finish", done));
  });
}

export async function bufferFetch(options: requestOptions) {
  if (!(options.url||options.socket)) throw new Error("Enter a url or an (IPC/Unix) socket");
  const urlRequest = (options.url||`${options.socket.protocoll||"http"}://unix:${options.socket.path}:`)+(options.path||"");
  return gotCjs().then(request => request(urlRequest, {
    headers: options.headers||{},
    method: options.method||"GET",
    json: options.body,
    responseType: "buffer",
  })).then(res => ({headers: res.headers, data: Buffer.from(res.body), response: res}));
}

export async function getBuffer(url: string, options?: {method?: string, body?: any, headers?: {[key: string]: string}}): Promise<Buffer> {
  const urlPar = new URL(url);
  return bufferFetch({
    path: urlPar.pathname,
    url: urlPar.protocol+"//"+urlPar.host,
    headers: options?.headers,
    body: options?.body,
    method: options?.method as any
  }).then(({data}) => data);
}

export async function getJSON<JSONReturn = any>(url: string|requestOptions, options?: requestOptions): Promise<JSONReturn> {
  return bufferFetch(typeof url === "string"?{...(options||{}), url}:url).then(({data}) => JSON.parse(data.toString("utf8")) as JSONReturn);
}

export async function saveFile(url: string, options?: {filePath?: string, headers?: {[key: string]: string}}) {
  const fileSave = options?.filePath||path.join(tmpdir(), Date.now()+"_raw_bdscore_"+path.basename(url));
  const fsStream = fs.createWriteStream(fileSave, {autoClose: false});
  await pipeFetch({url, stream: fsStream, headers: options?.headers});
  return fileSave;
}

export async function tarExtract(url: string, options?: {folderPath?: string, headers?: {[key: string]: string}}) {
  let fileSave = path.join(tmpdir(), "_bdscore", Date.now()+"_raw_bdscore");
  const Headers = {};
  if (options) {
    if (options.folderPath && typeof options.folderPath === "string") fileSave = options.folderPath;
    if (options.headers) Object.keys(options.headers).forEach(key => Headers[key] = String(options.headers[key]));
  }

  if (!fs.existsSync(fileSave)) await fs.promises.mkdir(fileSave, {recursive: true});
  const tar_Extract = tar.extract({
    cwd: fileSave,
    noChmod: false,
    noMtime: false,
    preserveOwner: true,
    keep: true,
    p: true
  });
  await pipeFetch({url, stream: tar_Extract, headers: options?.headers});
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

export type testIpv6 = {
  ip: string,
  type: "ipv4"|"ipv6",
  subtype: string,
  via: string,
  padding: string,
  asn: string,
  asnlist: string,
  asn_name: string,
  country: string,
  protocol: "HTTP/2.0"|"HTTP/1.1"|"HTTP/1.0"
};

export async function getExternalIP(): Promise<{ipv4: string, ipv6?: string, rawRequest?: {ipv4: testIpv6, ipv6?: testIpv6}}> {
  return getJSON<testIpv6>("https://ipv4.lookup.test-ipv6.com/ip/").then(ipv4 => getJSON<testIpv6>("https://ipv6.lookup.test-ipv6.com/ip/").then(ipv6 => ({ipv4: ipv4.ip, ipv6: ipv6?.ip, rawRequest: {ipv4, ipv6}})).catch(() => ({ipv4: ipv4.ip, rawRequest: {ipv4}})));
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
