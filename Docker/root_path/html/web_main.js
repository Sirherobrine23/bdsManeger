console.info("Welcome to Bds Maneger Web 2.0")
const token = (localStorage.getItem("the_token") || undefined),
    andress = (localStorage.getItem("the_addr") || undefined),
   port_log = (localStorage.getItem("the_log_port") || 6565),
  port_REST = (localStorage.getItem("the_log_port") || 1932)

if (andress){
    document.getElementById("bds_token").value = token
    document.getElementById("bds_addr").value = andress
    function basic_service (service){
        const post_men = {
            "token": token,
            "command": service
        }
        fetch(`http://${andress}:${port_REST}/service`,{
            method: "POST",
            mode: "cors",
            body: JSON.stringify(post_men),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(response => response.json()).then(lan => {
            console.log(lan)
        })
    }
    function bds_start(){
        basic_service("start")
    }

    function bds_stop (){
        basic_service("stop")
    }

    function bds_restart(){
        let log = document.getElementById("bds_log").innerHTML
        console.log("restart request")
        if (!(log.includes("Quit correctly"))) bds_stop()
        bds_start
    }
    function bds_command(){
        var post_men = {
            "token": token,
            "command": document.getElementById("command").value
        };
        fetch(`http://${andress}:${port_REST}/bds_command`, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(post_men),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
        ).then(response => response.json()).then(lan => {
            if (lan.status !== 200) {console.log(lan)}
            else {
                
            }
        })
    }
    setInterval(() => {
        fetch(`http://${andress}:${port_log}/?format=html`).then(response => response.text()).then(lan => {
            document.getElementById("bds_log").innerHTML = lan
        }).catch (function (err){null});
    }, 2 * 1000);
} else {
    /* alert("Please set the Bds Maneger's ip or address, and the authorization token for some advanced features")
    document.getElementById("config").style.display = "block" */
}

function settings_display(){
    const se_display = document.getElementById("config").style.display
    if (se_display === "block"){
        document.getElementById("config").style.display = "none"
    } else {
        document.getElementById("config").style.display = "block"
    }
}
