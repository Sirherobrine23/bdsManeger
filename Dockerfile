# Setup Bds Manerger Project Docker Base
FROM debian:testing AS bdsbase
USER root
ENV DEBIAN_FRONTEND="noninteractive" DOCKER_IMAGE="true"

# Copy Docker Files
COPY .Build/Docker/* /tmp

# Configure BASE
RUN bash /tmp/Configure.sh

# Setup bdsmaneger/core
FROM bdsbase AS bdscore

# Copy Bds Maneger Core
COPY ./ /opt/bds_core/
WORKDIR /opt/bds_core/
RUN chmod -v 7777 /opt/bds_core && chown thebds:thebds -v /opt/bds_core; chmod a+x bin/* && npm install --force && chmod -Rv 7777 /home && chown thebds:thebds -Rv /home && chmod a+x bin/*; mkdir -vp /home/bds/bds_core

# Set Non Root User
USER thebds
VOLUME [ "/home/thebds/bds_core" ]

# Set default ENVs to Bds Core
ENV PLAYERS="5" \
    WORLD_NAME="The Ultimate Server" \
    DESCRIPTION="running Minecraft Server on Bds Maneger by Bds Manager Project" \
    GAMEMODE="survival" \
    DIFFICULTY="normal" \
    ENABLE_COMMANDS="false" \
    ACCOUNT="false" \
    SERVER="bedrock"

# Bds Maneger Core required ports
EXPOSE 19132/udp 19133/udp 1932/tcp

# Set Entrypint
ENTRYPOINT [ "node", "./bin/Docker.js" ]
