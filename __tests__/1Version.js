const bds = require('../index');

test("Returns versions", ()=>{
    expect(bds.get_version());
    expect(bds.bds_latest);
    expect(bds.get_version('raw'));
});

test("Download latest version", ()=>{
    console.log(bds.bds_latest)
    bds.version_Download(bds.bds_latest)
});