import child_process, { ChildProcess } from "child_process";
import EventEmitter from "events";

export async function runAsync(command: string, args: Array<string|number>, options?: {env?: {[key: string]: string}, cwd?: string}): Promise<{stdout: string; stderr: string}> {
  if (!options) options = {};
  return await new Promise((resolve, reject) => {
    child_process.execFile(command, args.map(a => String(a)), {env: {...process.env, ...(options.env||{})}, cwd: options.cwd||process.cwd(), maxBuffer: Infinity}, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({stdout, stderr});
    });
  });
}

export async function runCommandAsync(command: string, options?: {env?: {[key: string]: string}, cwd?: string}): Promise<{stdout: string; stderr: string}> {
  if (!options) options = {};
  return await new Promise((resolve, reject) => {
    child_process.exec(command, {env: {...process.env, ...(options.env||{})}, cwd: options.cwd||process.cwd(), maxBuffer: Infinity}, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({stdout, stderr});
    });
  });
}

type execOptions = {
  runOn: "docker";
  dockerVolumeName: string;
  dockerImage: string;
  dockerContainerName: string;
}|{
  runOn: "host";
};

export async function execServer(options: execOptions, command: string, args: Array<string|number>, execOption: {env?: {[key: string]: string}, cwd?: string}) {
  let Exec: ChildProcess;
  if (options.runOn === "docker") {
    const { dockerVolumeName, dockerImage, dockerContainerName } = options;
    if (!dockerVolumeName) throw new Error("Docker volume name is not defined");
    await runAsync("docker", ["volume", "create", dockerVolumeName]);
    const dockerArgs: Array<string> = ["run", "--name", dockerContainerName, "--rm", "-i", "--entrypoint=bash", "-e", "volumeMount"];
    if (!!execOption.cwd) dockerArgs.push("--workdir", execOption.cwd);
    dockerArgs.push("-v", `${dockerVolumeName}:/data`);
    if (!!execOption.env) {
      for (const key in Object.keys(execOption.env)) dockerArgs.push("-e", String(key));
    }
    dockerArgs.push(dockerImage);
    dockerArgs.push(command, ...args.map(a => String(a)));
    Exec = child_process.execFile("docker", dockerArgs, {
      env: {...process.env, ...(execOption.env||{}), volumeMount: "/data"},
      maxBuffer: Infinity
    });
  } else if (options.runOn === "host") {
    Exec = child_process.execFile(command, args.map(a => String(a)), {
      env: {...process.env, ...(execOption.env||{})},
      cwd: execOption.cwd||process.cwd(),
      maxBuffer: Infinity
    });
  } else throw new Error("Unknown runOn");
  // server exec functions
  const execEvent = new EventEmitter();
  /** log data event */
  const on = (eventName: "out"|"err"|"all", call: (data: string) => void) => execEvent.on(eventName, call);
  /** log data event */
  const once = (eventName: "out"|"err"|"all", call: (data: string) => void) => execEvent.once(eventName, call);
  /** on server exit is event activate */
  const onExit = (): Promise<number> => {
    if (Exec.killed) {
      if (Exec.exitCode === 0) return Promise.resolve(0);
      return Promise.reject(Exec.exitCode === null ? 137:Exec.exitCode);
    }
    return new Promise<number>((res, rej) => Exec.on("exit", code => {
      if (code === 0) return res(0);
      return rej(code === null ? 137 : code);
    }));
  }

  // Storage tmp lines
  const tempLog = {out: "", err: ""};
  const parseLog = (to: "out"|"err", data: string) => {
    // Detect new line and get all line with storage line for run callback else storage line
    let lines = data.split(/\r?\n/);
    // if (lines[lines.length - 1] === "") lines.pop();
    if (lines.length === 1) tempLog[to] += lines[0];
    else {
      for (const line of lines.slice(0, -1)) {
        if (!!tempLog[to]) {
          execEvent.emit(to, tempLog[to]+line);
          execEvent.emit("all", tempLog[to]+line);
          tempLog[to] = "";
        } else {
          execEvent.emit(to, line);
          execEvent.emit("all", line);
        }
      }
    }
  }
  Exec.stdout.on("data", data => parseLog("out", data));
  Exec.stderr.on("data", data => parseLog("err", data));

  // Return
  return {
    on,
    once,
    onExit,
    writelf: (data: string|number|Array<string|number>) => {
      if (typeof data === "string") Exec.stdin.write(data+"\n");
      else if (Array.isArray(data)) {
        if (data.length === 0) return;
        else if (data.length === 1) Exec.stdin.write(data[0]+"\n");
        else data.forEach(d => Exec.stdin.write(d+"\n"));
      }
    },
    Exec
  };
}