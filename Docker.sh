#!/bin/bash
docker_image_name='thebdsmaneger/maneger'
docker build -f Docker/Dockerfile --tag ${docker_image_name} . && {
    echo "----------------------------------------------"
    read -rp "Run Image? (Y/n) " -e -i "y" DockerRun
    if [ "${DockerRun}" == "y" ];then docker run -ti --rm -P -v /tmp/bds:/home/bds ${1} ${docker_image_name};
    elif [ "${DockerRun}" == "Y" ];then docker run -ti --rm -P -v /tmp/bds:/home/bds ${1} ${docker_image_name};
    else echo "Run: \"docker run -ti --rm -P -v /tmp/bds:/home/bds ${1} ${docker_image_name}\"";
    fi
}