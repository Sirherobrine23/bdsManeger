#!/bin/bash
set -ex
if ! echo ${HOME} |grep -q '/home/bds';then export HOME="/home/bds/";fi
node /base/setup_node.js 
# --------------------------------------------------
service nginx start
node /base/server_start.js
exit $?