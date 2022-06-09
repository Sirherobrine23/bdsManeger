import * as net from "node:net";

export default async function portIsAllocated(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const tester = net.createServer()
    tester.once("error", () => () => resolve(true));
    tester.once("listening", () => {
      tester.once("close", () => resolve(false));
      tester.close();
    });
    tester.listen(port);
  });
}