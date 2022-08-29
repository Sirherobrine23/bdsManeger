import axios from "axios";

export async function getBuffer(url: string, config?: {body?: any, header?: {[key: string]: string}}): Promise<Buffer> {
  const Headers = {};
  let Body: any;
  if (config) {
    if (config.header) Object.keys(config.header).forEach(key => Headers[key] = config.header[key]);
    if (config.body) Body = config.body;
  }
  if (typeof fetch === "undefined") return axios.get(url, {
    responseEncoding: "arraybuffer",
    responseType: "arraybuffer",
    headers: Headers,
    data: Body
  }).then(({data}) => Buffer.from(data));
  return fetch(url, {
    method: "GET",
    body: typeof Body === "object" ? JSON.stringify(Body, null, 2):Body,
    headers: Headers
  }).then(res => res.arrayBuffer()).then(res => Buffer.from(res));
}