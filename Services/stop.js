module.exports.Server_stop = () => {
    const Storage = require('../index').Storage();
    if (typeof bds_server_string == 'undefined'){
        console.log("The server is stopped!");
        return false
    } else {
        bds_server_string.stdin.write('stop\n');
        bds_server_string.stdout.on('data', function (data) {
            if (data.includes('Quit correctly')){
                Storage.setItem('bds_status', false);
            }
        });
        if (!require('../Services/detect_bds').bds_detect())
            return true
        else
            return false
    };
};