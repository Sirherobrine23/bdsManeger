import child_process, { ChildProcess } from "child_process";

export async function runAsync(command: string, args: Array<string|number>, options?: {env?: {[key: string]: string}, cwd?: string}): Promise<{stdout: string; stderr: string}> {
  if (!options) options = {};
  return await new Promise((resolve, reject) => {
    child_process.execFile(command, args.map(a => String(a)), {env: {...process.env, ...(options.env||{})}, cwd: options.cwd||process.cwd(), maxBuffer: Infinity}, (err, stdout, stderr) => {
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

export async function execServer(options: execOptions, command: string, args: Array<string|number>, execOption: {env?: {[key: string]: string}, cwd?: string}): Promise<ChildProcess> {
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
    const dockerExec = child_process.execFile("docker", dockerArgs, {
      env: {...process.env, ...(execOption.env||{}), volumeMount: "/data"},
      maxBuffer: Infinity
    });
    return dockerExec;
  } else if (options.runOn === "host") {
    const serverExec = child_process.execFile(command, args.map(a => String(a)), {
      env: {...process.env, ...(execOption.env||{})},
      cwd: execOption.cwd||process.cwd(),
      maxBuffer: Infinity
    });
    return serverExec;
  }
  throw new Error("Unknown runOn");
}