const bds = require('../index');
var today = new Date();
const date = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
if (process.platform == 'win32') {
    var home = process.env.USERPROFILE.replaceAll('\\', '/');
    var server_dir = `${home}/bds_Server`;
    var cache_dir = `${home}/AppData/Roaming/${require(process.cwd()+'/package.json').name}\\`
    var log_file = `${server_dir}/${date}_Bds_log.log`
    var log_date = `${date}`
    var system = `windows`;
} else if (process.platform == 'linux') {
    var home = process.env.HOME;
    var server_dir = `${home}/bds_Server`;
    var cache_dir = `${home}/.config/${require(process.cwd() + '/package.json').name}/`
    var log_file = `${server_dir}/${date}_Bds_log.log`
    var log_date = `${date}`
    var system = `linux`;
};

test("home", ()=>{
    expect(bds.home).toBe(home);
});

test("system", ()=>{
    expect(bds.system).toBe(system);
});

test("Server Diretorio", ()=>{
    expect(bds.server_dir).toBe(server_dir);
});

test("Aplications Diretorio cache", ()=>{
    expect(bds.api_dir).toBe(cache_dir);
});

test("path log names", ()=>{
    expect(bds.log_file).toBe(log_file);
});

test("log date", ()=>{
    expect(bds.log_date).toBe(log_date);
});