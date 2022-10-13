import net from "net"
export async function randomPort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const address = srv.address();
      if (typeof address === "string") return rej(new Error("Invalid listen port"));
      srv.close((_err) => res(address.port));
    });
  });
}