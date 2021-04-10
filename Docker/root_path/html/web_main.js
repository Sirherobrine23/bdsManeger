console.info("Welcome to Bds Maneger Web 2.0")
const token = (localStorage.getItem("the_token") || undefined)
document.getElementById("bds_token").value = token
function basic_service (service){
    fetch("/api/service",{
        method: "POST",
        mode: "cors",
        body: JSON.stringify({
            "token": token,
            "command": service
        }),
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    }).then(response => response.json()).then(lan => {
        console.log(lan)
    })
}
function bds_start(){return basic_service("start")}

function bds_stop (){basic_service("stop")}

// eslint-disable-next-line no-unused-vars
function bds_restart(){
    let log = document.getElementById("bds_log").innerHTML
    console.log("restart request")
    if (!(log.includes("Quit correctly"))) bds_stop()
    bds_start()
}

// eslint-disable-next-line no-unused-vars
function bds_command(){
    fetch("/api/bds_command", {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({
            "token": token,
            "command": document.getElementById("command").value
        }),
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    }
    ).then(response => response.json()).then(lan => {
        console.log(lan);
    })
}

// eslint-disable-next-line no-unused-vars
function UploadWorld(){
    const input = document.getElementById("WorldUpload").files
    const formData = new FormData();
    console.log(input);
    formData.append(input[0].name, input[0]);
    for(var pair of formData.entries()) {
        console.log(pair[0]+ ", "+ JSON.stringify(pair[1])); 
    }
    fetch("/api/upload_world", {
        method: "POST",
        headers: {
            "Content-Type": "multipart/form-data",
            "token": token
        },
        body: input[0]
    }).catch(
        err => {
            throw Error(err)
        }
    )
}

const logInterval = setInterval(() => {
    fetch("/api/log?format=html").then(response => response.text()).then(lan => {
        document.getElementById("bds_log").innerHTML = lan
    }).catch (function (err){
        if (confirm("The server crashed or had an error, wants to reload the page")) location.reload(true)
        else clearInterval(logInterval)
        throw Error(err)
    });
}, 2 * 1000);

// eslint-disable-next-line no-unused-vars
function settings_display(){
    const se_display = document.getElementById("config").style.display
    if (se_display === "block") document.getElementById("config").style.display = "none"
    else document.getElementById("config").style.display = "block"
}
