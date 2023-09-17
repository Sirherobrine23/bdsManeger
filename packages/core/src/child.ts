import child_process from "node:child_process";
import stream from "node:stream";
import os from "node:os";

export class ChildProcess extends stream.Duplex {
  constructor(child: child_process.ChildProcess) {
    super({
      read() { },
      write(chunk, encoding, callback) {
        if (child.stdin) child.stdin.write(chunk, encoding, callback);
        else callback();
      },
    });
    const push = (chuck: any) => { this.push(chuck); }
    if (child.stdout) child.stdout.on("data", push).on("error", err => this.emit("error", err));
    if (child.stderr) child.stderr.on("data", push).on("error", err => this.emit("error", err));
    child.on("error", (err) => this.emit("error", err));
    child.once("exit", (code, signal) => {
      this.emit("exit", code, signal);
      this.push(null);
      this.end(null);
    });
  }

  /**
   * The `writable.write()` method writes some data to the stream, and calls the
   * supplied `callback` once the data has been fully handled. If an error
   * occurs, the `callback` will be called with the error as its
   * first argument. The `callback` is called asynchronously and before `'error'` is
   * emitted.
   *
   * The return value is `true` if the internal buffer is less than the`highWaterMark` configured when the stream was created after admitting `chunk`.
   * If `false` is returned, further attempts to write data to the stream should
   * stop until the `'drain'` event is emitted.
   *
   * While a stream is not draining, calls to `write()` will buffer `chunk`, and
   * return false. Once all currently buffered chunks are drained (accepted for
   * delivery by the operating system), the `'drain'` event will be emitted.
   * Once `write()` returns false, do not write more chunks
   * until the `'drain'` event is emitted. While calling `write()` on a stream that
   * is not draining is allowed, Node.js will buffer all written chunks until
   * maximum memory usage occurs, at which point it will abort unconditionally.
   * Even before it aborts, high memory usage will cause poor garbage collector
   * performance and high RSS (which is not typically released back to the system,
   * even after the memory is no longer required). Since TCP sockets may never
   * drain if the remote peer does not read the data, writing a socket that is
   * not draining may lead to a remotely exploitable vulnerability.
   *
   * Writing data while the stream is not draining is particularly
   * problematic for a `Transform`, because the `Transform` streams are paused
   * by default until they are piped or a `'data'` or `'readable'` event handler
   * is added.
   *
   * If the data to be written can be generated or fetched on demand, it is
   * recommended to encapsulate the logic into a `Readable` and use {@link pipe}. However, if calling `write()` is preferred, it is
   * possible to respect backpressure and avoid memory issues using the `'drain'` event:
   *
   * ```js
   * function write(data, cb) {
   *   if (!stream.write(data)) {
   *     stream.once('drain', cb);
   *   } else {
   *     process.nextTick(cb);
   *   }
   * }
   *
   * // Wait for cb to be called before doing any other write.
   * write('hello', () => {
   *   console.log('Write completed, do more writes now.');
   * });
   * ```
   *
   * A `Writable` stream in object mode will always ignore the `encoding` argument.
   * @since v0.9.4
   * @param chunk Optional data to write. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any
   * JavaScript value other than `null`.
   * @param callback Callback for when this chunk of data is flushed.
   * @return `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.
   */
  writel(chuck: any, cb?: (error: Error) => void) {
    if (!(Buffer.isBuffer(chuck))) chuck = Buffer.from(chuck);
    return this.write(Buffer.concat([chuck, Buffer.from(os.EOL)]), "binary", cb);
  }
}

export function spawn(commad: string, options: child_process.SpawnOptionsWithoutStdio): ChildProcess;
export function spawn(commad: string, args: string[], options: child_process.SpawnOptionsWithoutStdio): ChildProcess;
export function spawn(commad: string, args: string[]): ChildProcess;
export function spawn(commad: string): ChildProcess;
export function spawn(): ChildProcess {
  if (typeof arguments[1] === "object") {
    let index = 1;
    if (Array.isArray(arguments[1])) index = 2;
    if (!!arguments[index]) {
      (arguments[index] as child_process.SpawnOptionsWithoutStdio).env = Object.assign({}, process.env, (arguments[index] as child_process.SpawnOptionsWithoutStdio).env);
      (arguments[index] as child_process.SpawnOptionsWithoutStdio).stdio = ["pipe", "pipe", "pipe"];
    }
  }
  return new ChildProcess(child_process.spawn.apply(child_process, arguments));
}