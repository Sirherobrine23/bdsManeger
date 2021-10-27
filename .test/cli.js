const chai = require("chai");
const BdsCore = require("../index");
const { assert } = chai;

describe("Main Status", async () => {
  it("Detect Server is running", () => {
    assert.equal(BdsCore.detect(), false);
  });
});
