#!/bin/bash
docker_image_name='thebdsmaneger/maneger'
docker build -f Docker/Dockerfile --tag ${docker_image_name} . && \
echo "Run: \"docker run -ti --rm -P -v /tmp/bds:/home/bds ${1} ${docker_image_name}\""