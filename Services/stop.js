function Server_stop(Child_Variable){
    if (require('bds_maneger_api').Storage().getItem('bds_status') == 'stoped'){
        LogOut('\nYour server is already stopped');
    } else {
        Child_Variable.stdin.write('stop\n');
        if (require('bds_maneger_api').electron){
            require('bds_maneger_api').Storage().setItem('bds_status', 'stoped');
        } else {
            return true
        }/*Electron */
    };
};

module.exports = {
    Server_stop: Server_stop
}
