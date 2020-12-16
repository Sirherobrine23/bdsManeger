const bds = require('../index');

test("Bds kill", ()=>{
    expect(bds.kill()).toBe(false);
})

test("bds detect", () => {
  expect(bds.detect()).toBe(false);
});
