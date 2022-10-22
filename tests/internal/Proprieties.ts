import Proprieties from "../../src/lib/Proprieties";
const stringExample = `test.ls=aaa\ntest.ab=true`;

describe("Proprieties", () => {
  it("Parse", (done) => {
    if (Proprieties.parse(stringExample)["test.ls"] === "aaa") return done();
    done(new Error("Invalid parse Proprieties"));
  });
  it("Stringify", (done) => {
    if (Proprieties.stringify(Proprieties.parse(stringExample)) === stringExample) return done();
    done(new Error("Invalid stringify"));
  });
});