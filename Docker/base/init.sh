#!/bin/bash
if ! echo ${HOME} |grep -q '/home/bds'; then
    echo "Old home: ${HOME}"
    export HOME="/home/bds/"
    echo "New home: ${HOME}"
fi
node /base/setup_node.js 
# --------------------------------------------------
node /base/server_start.js
exit $?