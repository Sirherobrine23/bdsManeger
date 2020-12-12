module.exports.stopserver = (Child_Variable) => {
    const storage = require('node-persist');

    if (require('../index').electron){
        var bds_status = localStorage.getItem('bds_status') == 'stoped'
    } else {
        var bds_status = 
    }
    if (){
        LogOut('\nYour server is already stopped');
    } else {
        Child_Variable.stdin.write('stop\n');
        if (require('../index').electron){
            localStorage.setItem('bds_status', 'stoped');
        } else {
            return true
        }/*Electron */
    };
};

