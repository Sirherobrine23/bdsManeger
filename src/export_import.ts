import net from "node:net";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import tar from "tar";
import { bdsRoot } from "./pathControl";

export type payload = {
  raw?: string,
  httpVersion?: string,
  request?: {
    method: string,
    path: string,
  },
  response?: {
    code: number,
    text: string
  },
  header: {[key: string]: string|boolean|number},
  second?: payload,
  body?: any
};

const payloadRequest = /^(GET|POST|CONNECT|HEAD|PUT|DELETE)\s+(.*)\s+HTTP\/([0-9\.]+)/;
const payloadResponse = /HTTP\/([0-9\.]+)\s+([0-9]+)\s+([\w\S\s]+)/;
const parseHeard = /^([0-9A-Za-z\._-\s@]+):([\w\S\s]+)/;

export class payloadError extends Error {
  public payload: payload
  constructor(errMessage: string, payload: payload) {
    super(errMessage);
    this.payload = payload;
  }
}

function parsePayload(data: string): payload {
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
      } else payloadBody.second = parsePayload(`${line}\r\n${data}`);
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

function stringifyPayload(options: {code: number, message: string, headers?: {[keyName: string]: string|number|boolean}, body?: any}, socket: net.Socket) {
  let message = `HTTP/1.0 ${options.code} ${options.message}\r\n`;
  if (options.headers) Object.keys(options.headers).forEach(key => `${key}: ${options.headers[key]}\r\n`);
  message += "\r\n";
  if (options.body) message += JSON.stringify(options.body);
  socket.write(message+"\r\n");
  if (options.code !== 200) socket.end();
  return socket;
}

export function exportBds() {
  const server = net.createServer();
  let newConnection = false;
  const authToken = crypto.randomBytes(8).toString("base64");
  server.on("connection", async (socket): Promise<any> => {
    if (newConnection) return stringifyPayload({code: 400, message: "Server locked", body: {errro: "Server locked"}}, socket);
    const payload = parsePayload(await new Promise<string>(done => socket.once("data", res => done(res.toString("utf8")))));
    console.log(payload);
    if (payload.header.Authorization !== authToken) return stringifyPayload({code: 401, message: "Not allowed", body: {error: "Invalid token"}}, socket);
    else stringifyPayload({code: 200, message: "Success", headers: {Date: (new Date()).toISOString(), "Content-Type": "bdsStream/tar"}}, socket);
    newConnection = true;
    console.log("Sending to %s", socket.localAddress+":"+socket.localPort);
    // Compact bds root
    const tarCompress = tar.create({gzip: true, cwd: bdsRoot}, await fs.readdir(bdsRoot));
    tarCompress.pipe(socket);
    tarCompress.on("end", () => server.close());
  });
  return {
    authToken,
    server,
    listen() {
      return new Promise<number>(done => {
        server.listen(() => {
          console.log("Port listen on http://0.0.0.0:%s/, auth token '%s'", server.address()["port"], authToken);
          done(server.address()["port"]);
        });
      });
    },
    PromisseWait: new Promise<void>((done) => {
      server.once("close", () => {
        console.log("Export end");
        done();
      });
    })
  };
}

export async function importBds(host: string, port: number, authToken: string) {
  const client = net.createConnection({host, port});
  client.write(`GET / HTTP/1.0\r\nAuthorization: ${authToken}\r\n\r\n`);
  parsePayload(await new Promise<string>(done => client.once("data", res => done(res.toString("utf8")))));
  const tarE = tar.extract({cwd: bdsRoot, noChmod: false, noMtime: false, preserveOwner: true});
  client.pipe(tarE);
  return new Promise<void>((done, reject) => {
    client.once("close", () => done());
    client.on("error", reject);
    tarE.on("error", reject);
  });
}