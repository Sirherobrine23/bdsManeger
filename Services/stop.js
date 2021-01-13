module.exports.Server_stop = () => {
    if (typeof bds_server_string == 'undefined')
        console.log("The server is stopped!");
     else {
        const Storage = LocalStorage;
        bds_server_string.stdin.write('stop\n');
        bds_server_string.stdout.on('data', function (data){
            if (data.includes('Quit correctly')){
                Storage.setItem('bds_status', false)
            };
        });
    };
    return !(require('./detect_bds').bds_detect())
}