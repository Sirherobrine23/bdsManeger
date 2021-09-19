const fs = require('fs');
const Package_JSon = JSON.parse(fs.readFileSync(process.cwd()+'/package.json', 'utf8'));
const run_ID = process.env.RunID || "1111111111111111111111111111111111111";
Package_JSon.version = `${run_ID.slice(0, 2)}.${run_ID.slice(3, 6)}.${run_ID.slice(7, 11)}`;
fs.writeFileSync(process.cwd()+'/package.json', JSON.stringify(Package_JSon, null, 2));
console.log(Package_JSon.version);
