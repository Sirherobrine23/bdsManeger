import { execAsync, execFileAsync, commendExists } from "../../src/lib/childPromisses";

describe("Child Process Async/Await", () => {
  it("Exec", async () => execAsync("ls .."));
  it("Exec File", async () => execFileAsync("ls", [".."]));
  it("Command Exists", async () => commendExists("bash", false));
});