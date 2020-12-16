const bds = require('../index');
var today = new Date();
const DAT_check = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
test('Date', () => {
  expect(bds.date()).toBe(DAT_check);
});