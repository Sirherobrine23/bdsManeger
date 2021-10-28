const chai = require("chai");
const { assert } = chai;
const BdsCore = require("../index");

describe("Small functions", () => {
  it("Detect Server is running", function (done) {
    this.timeout(10000);
    assert.equal(BdsCore.detect(), false);
    done();
  });
  it("List Platforms Avaible", async function() {
    this.timeout(10 * 1000);
    await BdsCore.CheckSystem();
  });
  it("Update Platform to Java", function(done) {
    BdsCore.platform_update("java");
    done();
  });
  it("Update Platform to dragonfly", function(done) {
    BdsCore.platform_update("dragonfly");
    done();
  });
  it("Register And Delete API Token", function (done) {
    const Token = BdsCore.token_register();
    BdsCore.delete_token(Token);
    done();
  });
  it("Get Server Config", function (done) {
    BdsCore.get_server_config();
    done();
  });
});

describe("Slow Functions", function () {
  it ("Download Server", async function () {
    this.timeout(60 * 1000);
    await BdsCore.download_server();
  });
});