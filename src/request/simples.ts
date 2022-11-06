import type { Method } from "got";
import * as fs from "node:fs";
import * as stream from "node:stream";

export let got: (typeof import("got"))["default"];
async function gotCjs(): Promise<(typeof import("got"))["default"]> {
  if (got) return got;
  const dyImport = (await (eval('import("got")') as Promise<typeof import("got")>)).default.extend({
    enableUnixSockets: true,
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
      "Accept": "*/*"
    }
  });
  got = dyImport;
  return dyImport;
}

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
    ...((options.method||"GET").toLowerCase()!=="get"?(typeof options.body === "string"?{body: options.body}:{json: options.body}):{}),
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
    responseType: "buffer",
    headers: options.headers||{},
    method: options.method||"GET",
    ...((options.method||"GET").toLowerCase()!=="get"?(typeof options.body === "string"?{body: options.body}:{json: options.body}):{}),
  }).then(res => ({headers: res.headers, data: Buffer.from(res.body), response: res}));
}

export async function getJSON<JSONReturn = any>(request: string|requestOptions): Promise<JSONReturn> {
  return bufferFetch(request).then(({data}) => JSON.parse(data.toString("utf8")) as JSONReturn)
}

export async function urls(options: requestOptions|string): Promise<string[]> {
  const data = (await bufferFetch(options)).data.toString("utf8");
  return (data.match(/((http[s]):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))/g)).map(res => typeof res === "string"?res:res[1]);
}