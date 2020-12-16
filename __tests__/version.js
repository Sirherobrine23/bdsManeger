const bds = require('../index');

test("Returns versions", ()=>{
    expect(bds.get_version());
    console.log(bds.get_version())
    console.log(bds.get_version('raw'))
});

test("Download latest version", ()=>{
    console.log(bds.bds_latest)
    bds.version_Download(bds.bds_latest)
});