import type { Method } from "got";
import * as fs from "node:fs";
import * as stream from "node:stream";

const UserAgent = "Mozilla/5.0 (Linux; Android 12; moto g(7) plus) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36";

export let got;
async function gotCjs(): Promise<(typeof import("got"))["default"]> {
  if (got) return got;
  const dyImport = (await (eval('import("got")') as Promise<typeof import("got")>)).default.extend({enableUnixSockets: true, headers: {"User-Agent": UserAgent, "USER-AGENT": UserAgent, "user-agent": UserAgent}});
  got = dyImport;
  return dyImport;
}

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

const httpUrl = /^http[s]:\/\/[a-z0-9\.\-_]+(|\/([\s\W\S]+?))/;
export async function urls(options: requestOptions|string): Promise<string[]> {
  const data = (await bufferFetch(options)).data.toString("utf8");
  return data.split(/["'<>]/gi).filter(line => httpUrl.test(line))
}
