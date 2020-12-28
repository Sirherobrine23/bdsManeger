module.exports.command = (command) => {
    if (bds_server_string == undefined) {
        console.error('Start Server!')
    } else {
        if (command == undefined) {
            console.error('command?')
        } else {
            bds_server_string.stdin.write(`${command}\n`);
        } /*Command Send*/
    } /*child_process*/
};