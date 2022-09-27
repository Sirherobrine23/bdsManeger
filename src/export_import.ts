import net from "node:net";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import tar from "tar";
import { bdsRoot } from "./platformPathManeger";

export type payload = {
  httpVersion?: string,
  request?: {
    method: string,
    path: string,
  },
  response?: {
    code: number,
    text: string
  },
  header?: {[key: string]: string|boolean|number},
  second?: payload,
  body?: any,
  raw?: string,
};

export class payloadError extends Error {
  public payload: payload;
  constructor(errMessage: string, payload: payload) {
    super(errMessage);
    this.payload = payload;
  }
}

const payloadRequest = /^(GET|POST|CONNECT|HEAD|PUT|DELETE)\s+(.*)\s+HTTP\/([0-9\.]+)/;
const payloadResponse = /HTTP\/([0-9\.]+)\s+([0-9]+)\s+([\w\S\s]+)/;
const parseHeard = /^([0-9A-Za-z\._-\s@]+):([\w\S\s]+)/;
async function parsePayload(input: string|Buffer|net.Socket): Promise<payload> {
  let data = "";
  if (typeof input === "string") data = input; else {
    if (Buffer.isBuffer(input)) data = input.toString("utf8");
    else data = await new Promise<string>(done => input.once("data", dataInput => done(dataInput.toString("utf8"))))
  }
  const payloadBody: payload = {raw: data, header: {}};
  if (/^{.*}$/.test(data.replace(/\r?\n/, ""))) {
    payloadBody.body = JSON.parse(data);
    return payloadBody;
  }
  for (const line of data.trim().split(/\r?\n/g)) {
    data = data.replace(line, "").trim();
    if (payloadResponse.test(line) && !payloadBody.request) {
      const [, httpVersion, CodeNumber, responseText] = line.match(payloadResponse);
      payloadBody.httpVersion = httpVersion;
      payloadBody.response = {
        code: parseInt(CodeNumber),
        text: responseText
      };
    } else if (payloadRequest.test(line) && !payloadBody.response) {
      const [, method, reqPath, httpVersion] = line.match(payloadRequest);
      if (!payloadBody.request) {
        payloadBody.httpVersion = httpVersion;
        payloadBody.request = {
          method: method,
          path: reqPath
        };
        continue;
      } else payloadBody.second = await parsePayload(`${line}\r\n${data}`);
      break;
    } else if (parseHeard.test(line.trim())) {
      const [, key, value] = line.trim().match(parseHeard);
      if (value.trim() === "false"||value.trim() === "true") payloadBody.header[key.trim()] = Boolean(value.trim());
      else if (/^[0-9]+$/.test(value.trim())) payloadBody.header[key.trim()] = parseFloat(value.trim());
      else payloadBody.header[key.trim()] = value.trim();
      continue;
    }
    payloadBody.body = data.trim();
    if (line.trim() === "") break;
  };
  if (payloadBody.body) {
    const backupBody = payloadBody.body;
    try {
      payloadBody.body = JSON.parse(backupBody);
    } catch (_) {
      payloadBody.body = backupBody;
    }
  }
  if (payloadBody.response) {
    if (!/[12][0-9][0-9]/.test(payloadBody.response.code.toFixed())) throw new payloadError(`Response code ${payloadBody.response.code}, text: ${payloadBody.response.text}`, payloadBody);
  }
  return payloadBody;
}

function stringifyPayload(socket: net.Socket, response: payload) {
  let message = "";
  if (response.request) message += `${response.request.method.toUpperCase()} ${response.request.path} HTTP/${response.httpVersion||"1.0"}\r\n`;
  else message += `HTTP/${response.httpVersion||"1.0"} ${response.response.code} ${response.response.text}\r\n`;
  if (response.header) Object.keys(response.header).forEach(key => `${key}: ${response.header[key]}\r\n`);
  message += "\r\n";
  if (response.body !== undefined) {
    if (Array.isArray(response.body)||typeof response.body === "object") message += JSON.stringify(response.body);
    else if (typeof response.body === "string") message += response.body;
    else if (typeof response.body === "bigint") message += response.body.toString();
    else message += String(response.body);
  }
  socket.write(message);
  return socket;
}

export class exportBds {
  public acceptConnection = true;
  public authToken = crypto.randomBytes(16).toString("base64");
  #server = net.createServer(async (socket): Promise<any> => {
    if (!this.acceptConnection) return stringifyPayload(socket, {response: {code: 400, text: "Server locked"}, body: {erro: "Server locked"}}).end();
    const payload = await parsePayload(await new Promise<string>(done => socket.once("data", res => done(res.toString("utf8")))));
    console.log(payload);
    if (payload.header.Authorization !== this.authToken) return stringifyPayload(socket, {response: {code: 401, text: "Not allowed"}, body: {error: "Invalid token"}}).end();
    else stringifyPayload(socket, {response: {code: 200, text: "Success"}, header: {Date: (new Date()).toISOString(), "Content-Type": "bdsStream/tar"}});
    this.acceptConnection = false;
    console.log("Sending to %s", socket.localAddress+":"+socket.localPort);
    // Compact bds root
    const tarCompress = tar.create({gzip: true, cwd: bdsRoot}, await fs.readdir(bdsRoot));
    tarCompress.pipe(socket);
    tarCompress.on("data", ({length}) => console.log("Send to %s, size: %f", socket.localAddress+":"+socket.localPort, length));
    tarCompress.on("end", () => this.#server.close());
  });

  public async listen(port = 0) {
    return new Promise<number>(done => {
      this.#server.listen(port, () => {
        let address = this.#server.address()["address"], port = this.#server.address()["port"];
        if (/::/.test(address)) address = `[${address}]`;
        console.log("Port listen on http://%s:%s/, auth token '%s'", address, port, this.authToken);
        return done(port);
      });
    });
  }
  public async waitClose() {
    return new Promise<void>((done, reject) => {
      this.#server.on("error", reject);
      this.#server.once("close", done);
    });
  }
}

export async function importBds(option: {host: string, port: number, authToken: string}) {
  await fs.rename(bdsRoot, bdsRoot+"_backup_"+Date.now());
  const client = stringifyPayload(net.createConnection({host: option.host, port: option.port}), {request: {method: "GET", path: "/"}, header: {Authorization: option.authToken}});
  await parsePayload(client);
  const tar_extract = tar.extract({cwd: bdsRoot, noChmod: false, noMtime: false, preserveOwner: true});
  client.pipe(tar_extract);
  client.on("data", ({length}) => console.log("Recive size: %f", length));
  return new Promise<void>((done, reject) => {
    client.once("close", () => done());
    client.on("error", reject);
    tar_extract.on("error", reject);
  });
}