module.exports.command = (Variable_storaged, command) => {
    if (Variable_storaged == undefined) {
        console.error('Child_process Variable?')
    } else {
        if (command == undefined) {
            console.error('command?')
        } else {
            if (command == 'stop'){
                Variable_storaged.stdin.write(`stop\n`)
                Variable_storaged.on('exit', function (code){
                    if (code == 0){
                        null
                    };
                });
            } else {
                Variable_storaged.stdin.write(`${command}\n`)
            }
        } /*Command Send*/
    } /*child_process*/
};