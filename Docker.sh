#!/bin/bash
docker_image_name='thebdsmaneger/maneger'
docker build -f Docker/Dockerfile ${1} --tag ${docker_image_name} . && {
    echo "----------------------------------------------"
    if [ -e "/tmp/start_image" ];then DockerRun="y"; else read -rp "Run Image? (Y/n) " -e -i "y" DockerRun;fi
    if [ -e "/tmp/start_image" ] || [ "${DockerRun}" == "y" ] || [ "${DockerRun}" == "Y" ];then [ -e "/tmp/start_image" ]|| touch /tmp/start_image ; docker run -ti --rm -p 8887:80/tcp -p 19132/udp -p 19133/udp -v /tmp/bds:/home/bds ${2} ${docker_image_name};
    else echo "Run: \"docker run -ti --rm -p 8887:80 -p 19132/udp -p 19133/udp -v /tmp/bds:/home/bds ${2} ${docker_image_name}\"";
    fi
}