#!/bin/bash
set -ex
if ! echo ${HOME} |grep -q '/home/bds'; then
    echo "Old home: ${HOME}"
    export HOME="/home/bds/"
    echo "New home: ${HOME}"
fi
node /base/setup_node.js 
# --------------------------------------------------
service nginx start

if [ -z "${ngrok_token}" ];then
    echo "Ngrok will give 24 hours of a personalized domain"
else
    ngrok authtoken "${ngrok_token}"
fi
screen -dm ngrok http 80
sleep 30s
echo "Ngrok Url: $(curl -s localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')"
echo "Ngrok Url: $(curl -s localhost:4040/api/tunnels | jq -r '.tunnels[1].public_url')"
node /base/server_start.js
exit $?