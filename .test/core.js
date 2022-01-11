const chai = require("chai");
const { assert } = chai;
process.env.ShowLoadTime = true;
const BdsCore = require("../src/index");

describe("Small functions", () => {
  it("Detect Server is running", function (done) {
    this.timeout(10000);
    assert.equal(BdsCore.BdsCkeckKill.Detect(), false);
    done();
  });
  it("List Platforms Avaible", async function() {
    this.timeout(10 * 1000);
    await BdsCore.BdsSystemInfo.SystemInfo();
  });
  it("Update Platform to Java", function(done) {
    BdsCore.BdsSettings.ChangePlatform("java");
    done();
  });
  it("Update Platform to dragonfly", function(done) {
    BdsCore.BdsSettings.ChangePlatform("dragonfly");
    done();
  });
  it("Register And Delete Token", function (done) {
    const Token = BdsCore.BdsToken.CreateToken();
    BdsCore.BdsToken.DeleteToken(Token.Token);
    done();
  });
  it("Get Server Config", function (done) {
    BdsCore.BdsServerSettings.get_config();
    done();
  });
});
