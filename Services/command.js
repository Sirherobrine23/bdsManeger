module.exports.command = (Variable_storaged, command) => {
    if (Variable_storaged == undefined) {
        console.error('Child_process Variable?')
    } else {
        if (command == undefined) {
            console.error('command?')
        } else {
            Variable_storaged.stdin.write(`${command}\n`);
        } /*Command Send*/
    } /*child_process*/
};