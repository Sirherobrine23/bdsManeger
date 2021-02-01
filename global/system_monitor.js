const si = require("systeminformation");
    setInterval(() => {
        si.cpu().then(data => {module.exports.cpu_speed = Math.trunc(data.speed)})
        si.mem().then(data => {
            module.exports.ram_free = Math.trunc(data.free / 1024 / 1024 / 1024);
            module.exports.ram_total = Math.trunc(data.total / 1024 / 1024 / 1024);
        })
        si.currentLoad().then(data => {
            module.exports.current_cpu = Math.trunc(data.currentload)
        })

    }, 1000);
    si.processes().then(data => {
        const list = data.list
        for (let pid in list) {
            var pids = list[pid].command
            if (pids.includes("server")){
                module.exports.bds_cpu = Math.trunc(list[pid].pcpu)
            } else {
                pid++
            }
        }
    })
    setInterval(() => {
        si.processes().then(data => {
            const list = data.list
            for (let pid in list) {
                var pids = list[pid].command
                if (pids.includes("server")){
                    module.exports.bds_cpu = Math.trunc(list[pid].pcpu)
                } else {
                    pid++
                }
            }
        })
    }, 3000);
