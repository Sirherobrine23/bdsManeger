function Server_stop(Child_Variable){
    const Storage = require('../index').Storage()
    Child_Variable.stdin.write('stop\n');
    Child_Variable.stdout.on('data', function (data) {
        if (data.includes('Quit correctly')){
            Storage.setItem('bds_status', false);
        }
    });
    return require('../Services/detect_bds').bds_detect()
};
module.exports = {
    Server_stop: Server_stop
}
