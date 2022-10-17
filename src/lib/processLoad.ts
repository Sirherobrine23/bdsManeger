import { EventEmitter } from "node:events";
// import customProcess from "./childPromisses";
import extendsFs from "./extendsFs";
import path from "node:path";
import fs from "node:fs/promises";
// import os from "node:os";

export type pidstat = {
  /** The process id. **/
  pid: number,
  /** The filename of the executable **/
  exName: string,
  /** 'R' is running, 'S' is sleeping, 'D' is sleeping in an uninterruptible wait, 'Z' is zombie, 'T' is traced or stopped **/
  state: "R"|"S"|"D"|"Z"|"T",
  /** effective user id **/
  euid: number,
  /** effective group id */
  egid: number,
  /** The pid of the parent. **/
  ppid: number,
  /** The pgrp of the process. **/
  pgrp: number,
  /** The session id of the process. **/
  session: number,
  /** The tty the process uses **/
  tty: number,
  /** (too long) **/
  tpgid: number,
  /** The flags of the process. **/
  flags: number,
  /** The number of minor faults **/
  minflt: number,
  /** The number of minor faults with childs **/
  cminflt: number,
  /** The number of major faults **/
  majflt: number,
  /** The number of major faults with childs **/
  cmajflt: number,
  /** user mode jiffies **/
  utime: number,
  /** kernel mode jiffies **/
  stime: number,
  /** user mode jiffies with childs **/
  cutime: number,
  /** kernel mode jiffies with childs **/
  cstime: number,
  /** process's next timeslice **/
  counter: number,
  /** the standard nice value, plus fifteen **/
  priority: number,
  /** The time in jiffies of the next timeout **/
  timeout: number,
  /** The time before the next SIGALRM is sent to the process **/
  itrealvalue: number,
  /** Time the process started after system boot **/
  starttime: number,
  /** Virtual memory size **/
  vsize: number,
  /** Resident Set Size **/
  rss: number,
  /** Current limit in bytes on the rss **/
  rlim: number,
  /** The address above which program text can run **/
  startcode: number,
  /** The address below which program text can run **/
  endcode: number,
  /** The address of the start of the stack **/
  startstack: number,
  /** The current value of ESP **/
  kstkesp: number,
  /** The current value of EIP **/
  kstkeip: number,
  /** The bitmap of pending signals **/
  signal: number,
  /** The bitmap of blocked signals **/
  blocked: number,
  /** The bitmap of ignored signals **/
  sigignore: number,
  /** The bitmap of catched signals **/
  sigcatch: number,
  /** (too long) **/
  wchan: number,
  /** scheduler **/
  sched: number,
  /** scheduler priority **/
  sched_priority: any
};

// Receive: bytes    packets errs drop fifo frame compressed multicast
// Transmit: bytes    packets errs drop fifo colls carrier compressed
export type netDef = {
  recive: {
    bytes: number,
    packets: number,
    errs: number,
    drop: number,
    fifo: number,
    frame: number,
    compressed: number,
    multicast: number
  },
  transmit: {
    bytes: number,
    packets: number,
    errs: number,
    drop: number,
    fifo: number,
    colls: number,
    carrier: number,
    compressed: number
  }
};

export type avg = {cwd: string, cmdline: string[], net: {[name: string]: netDef}, cpuAvg: pidstat}

export declare interface processLoad {
  on(act: "error", fn: (data: any) => void): this;
  once(act: "error", fn: (data: any) => void): this;
  emit(act: "error", data: any): boolean;

  on(act: "avg", fn: (data: avg & {latestLoop?: Date}) => void): this;
  once(act: "avg", fn: (data: avg & {latestLoop?: Date}) => void): this;
  emit(act: "avg", data: avg & {latestLoop?: Date}): boolean;
}

const validPlatformToRun: NodeJS.Platform[] = [
  "android",
  "linux"
];

export class processLoad extends EventEmitter {
  pidNumber: number;
  private terminateProcess = true;
  #procFolder = "/proc";

  close(){this.terminateProcess = false; return this;}

  async getInfo(): Promise<avg> {
    const pidFolder = path.join(this.#procFolder, this.pidNumber.toFixed(0));
    if (!await extendsFs.exists(pidFolder)) throw new Error("PID not found!");
    // cwd
    const cwd = await fs.realpath(path.join(pidFolder, "cwd"));

    // cmdline
    const cmdline = (await fs.readFile(path.join(pidFolder, "cmdline"), "utf8")).trim().split(/\u0000/).filter(a => !!a);

    // stat
    const [pid, exName, state, euid, egid, ppid, pgrp, session, tty, tpgid, flags, minflt, cminflt, majflt, cmajflt, utime, stime, cutime, cstime, counter, priority, timeout, itrealvalue, starttime, vsize, rss, rlim, startcode, endcode, startstack, kstkesp, kstkeip, signal, blocked, sigignore, sigcatch, wchan, sched, sched_priority] = (await fs.readFile(path.join(pidFolder, "stat"), "utf8")).trim().split(/\s+|[\t]+|\t/);
    const cpuAvg: pidstat = {
      pid: parseInt(pid),
      exName, state: state as pidstat["state"], euid: parseInt(euid),
      egid: parseInt(egid),
      ppid: parseInt(ppid),
      pgrp: parseInt(pgrp),
      session: parseInt(session),
      tty: parseInt(tty),
      tpgid: parseInt(tpgid),
      flags: parseInt(flags),
      minflt: parseInt(minflt),
      cminflt: parseInt(cminflt),
      majflt: parseInt(majflt),
      cmajflt: parseInt(cmajflt),
      utime: parseInt(utime),
      stime: parseInt(stime),
      cutime: parseInt(cutime),
      cstime: parseInt(cstime),
      counter: parseInt(counter),
      priority: parseInt(priority),
      timeout: parseInt(timeout),
      itrealvalue: parseInt(itrealvalue),
      starttime: parseInt(starttime),
      vsize: parseInt(vsize),
      rss: parseInt(rss),
      rlim: parseInt(rlim),
      startcode: parseInt(startcode),
      endcode: parseInt(endcode),
      startstack: parseInt(startstack),
      kstkesp: parseInt(kstkesp),
      kstkeip: parseInt(kstkeip),
      signal: parseInt(signal),
      blocked: parseInt(blocked),
      sigignore: parseInt(sigignore),
      sigcatch: parseInt(sigcatch),
      wchan: parseInt(wchan),
      sched: parseInt(sched),
      sched_priority
    };

    // net
    const netInterface = /([a-zA-Z0-9_\-]+):\s+(.*)/;
    const net: {[name: string]: netDef} = {};
    (await fs.readFile(path.join(pidFolder, "net/dev"), "utf8")).split(/\r?\n/).filter(line => netInterface.test(line)).forEach(line => {
      const dataMath = line.match(netInterface);
      if (!dataMath) return;
      const [, interfaceName, data] = dataMath;
      const [recive_bytes, recive_packets, recive_errs, recive_drop, recive_fifo, recive_frame, recive_compressed, recive_multicast, transmit_bytes, transmit_packets, transmit_errs, transmit_drop, transmit_fifo, transmit_colls, transmit_carrier, transmit_compressed] = data.split(/\s+/).map(numberString => parseInt(numberString));
      net[interfaceName] = {
        recive: {
          bytes: recive_bytes,
          compressed: recive_compressed,
          drop: recive_drop,
          errs: recive_errs,
          fifo: recive_fifo,
          frame: recive_frame,
          multicast: recive_multicast,
          packets: recive_packets
        },
        transmit: {
          bytes: transmit_bytes,
          carrier: transmit_carrier,
          colls: transmit_colls,
          compressed: transmit_compressed,
          drop: transmit_drop,
          errs: transmit_errs,
          fifo: transmit_fifo,
          packets: transmit_packets
        }
      };
      return;
    });

    return {cwd, cmdline, net, cpuAvg};
  }

  latestLoop: Date;
  async loop() {
    while(this.terminateProcess) {
      await this.getInfo().then(data => this.emit("avg", {...data, latestLoop: this.latestLoop})).catch(err => this.emit("error", err));
      this.latestLoop = new Date();
      await new Promise(done => setTimeout(done, 2500));
    }
  }

  constructor(processPid: number) {
    super({captureRejections: false});
    if (!validPlatformToRun.includes(process.platform)) throw new Error("Platform not valid to run process load");
    this.pidNumber = processPid;
    // this.load();
  }
}