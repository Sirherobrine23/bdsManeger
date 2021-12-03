FROM ubuntu:latest
USER root
ENV DEBIAN_FRONTEND="noninteractive" DOCKER_IMAGE="true"

# Install Core Packages
RUN apt update && apt install -y curl wget git sudo unzip zip jq python3 xz-utils tar

# Install Node.js
RUN NODEVERSION=$(curl -sL https://api.github.com/repos/nodejs/node/releases | grep tag_name | cut -d '"' -f 4 | sort -V | tail -n 1) && \
  case $(uname -m) in x86_64 ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-x64.tar.xz" -O /tmp/node.tar.xz;;aarch64 ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-arm64.tar.xz" -O /tmp/node.tar.xz;;armv7l ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-armv7l.tar.xz" -O /tmp/node.tar.xz;;ppc64el ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-ppc64le.tar.xz" -O /tmp/node.tar.xz;;s390x ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-s390x.tar.xz" -O /tmp/node.tar.xz;;*) echo "Unsupported architecture"; exit 1;;esac && \
  mkdir /tmp/Node && \
  tar -xJf /tmp/node.tar.xz -C /tmp/Node && \
  rm -rf /tmp/node.tar.xz && \
  cp -rf /tmp/Node/*/* /usr && \
  rm -rf /tmp/Node

# Update NPM
RUN npm -g install npm@latest

# Install external Libries to ARM64
ARG LibrieZip="https://github.com/The-Bds-Maneger/external_files/raw/main/Linux/libs_amd64.zip"
RUN if ! [ "$(uname -m)" == "x86_64" ];then mkdir -p /lib64;apt install -y qemu-user-static;wget -q "${LibrieZip}" -O /tmp/libries.zip;unzip -o /tmp/libries.zip -d /;rm -rfv /tmp/libries.zip; fi

# Install Java
RUN case "$(apt search openjdk)" in *openjdk-17* ) apt install -y openjdk-17*;; *openjdk-11* ) apt install -y openjdk-11*;; * ) echo "No openjdk version found, skipping";;esac

# Create Volume to Storage Server And Config
VOLUME [ "/root/bds_core" ]

# Set default ENVs to Bds Core
ENV PLAYERS="5" \
  WORLD_NAME="The Ultimate Server" \
  DESCRIPTION="running Minecraft Server on Bds Maneger by Bds Manager Project" \
  GAMEMODE="survival" \
  DIFFICULTY="normal" \
  ENABLE_COMMANDS="false" \
  ACCOUNT="false" \
  SERVER="bedrock" \
  SERVER_VERSION="true"

# Bds Maneger Core required ports
EXPOSE 19132/udp 19133/udp 1932/tcp

# Copy Bds Maneger Core
WORKDIR /opt/backend_core_scripts/

# Install Core dependencies
COPY package*.json ./
RUN npm install

# Copy BdsManger Core
COPY ./ ./
RUN chmod a+x -vR bin/*

# Set Entrypint
ENTRYPOINT [ "node", "./bin/Docker.js" ]
