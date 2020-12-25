function Server_stop(Child_Variable){
    if (require('bds_maneger_api').Storage().getItem('bds_status') == 'stoped'){
        console.info('\nYour server is already stopped');
    } else {
        Child_Variable.stdin.write('stop\n');
        require('bds_maneger_api').Storage().setItem('bds_status', 'stoped');
        return true
    };
};

module.exports = {
    Server_stop: Server_stop
}
