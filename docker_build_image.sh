#!/bin/bash
docker_image_name='thebdsmaneger/maneger'
docker pull bdsmaneger/node_image:latest
docker build -f Docker/Dockerfile --tag ${docker_image_name} .
echo "Run: \"docker run -ti --rm -P -v /tmp/bds:/home/bds ${1} ${docker_image_name}\""