FROM debian:latest
LABEL name="Bds Maneger Docker"
LABEL org.opencontainers.image.title="Bds Maneger Docker"
LABEL org.opencontainers.image.description="Start Minecraft Server with Docker containers and Auto Control Server wirh Bds Maneger Core."
LABEL org.opencontainers.image.vendor="Sirherobrine23"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/The-Bds-Maneger/Bds-Maneger-Core.git"
ENV DEBIAN_FRONTEND="noninteractive"

# Install Core Packages
RUN apt update && apt install -y curl wget unzip zip xz-utils tar procps

# Install external Libries to another architecture
RUN if [ "$(uname -m)" != "x86_64" ];then \
  mkdir -p /lib64; \
  apt install -y qemu-user-static; \
  wget -q "https://github.com/The-Bds-Maneger/external_files/raw/main/Linux/libs_amd64.zip" -O /tmp/libries.zip; \
  unzip -o /tmp/libries.zip -d /; \
  rm -rfv /tmp/libries.zip; \
fi

# Install external Libries to ARM64
RUN apt install -y ca-certificates make build-essential procps lsb-release xdg-utils g++ libatomic1 libnss3 libatk-bridge2.0-0 gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxrandr2 libxrender1 libxss1 libxtst6 fonts-liberation libnss3 libgbm-dev

# Install Node.js
RUN NODEVERSION=$(wget -qO- https://api.github.com/repos/nodejs/node/releases | grep tag_name | cut -d '"' -f 4 | sort -V | tail -n 1) && \
  case $(uname -m) in \
    x86_64 ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-x64.tar.xz" -O /tmp/node.tar.xz;; \
    aarch64 ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-arm64.tar.xz" -O /tmp/node.tar.xz;; \
    armv7l ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-armv7l.tar.xz" -O /tmp/node.tar.xz;; \
    ppc64el ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-ppc64le.tar.xz" -O /tmp/node.tar.xz;; \
    s390x ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-s390x.tar.xz" -O /tmp/node.tar.xz;; \
    *) echo "Unsupported architecture"; exit 1;; \
  esac && \
  mkdir /tmp/Node && \
  tar -xJf /tmp/node.tar.xz -C /tmp/Node && \
  rm -rf /tmp/node.tar.xz && \
  cp -rf /tmp/Node/*/* /usr && \
  rm -rf /tmp/Node && \
  npm -g install npm@latest

# Install openjdk
RUN apt update && \
  JAVAVERSIONS="$(apt search openjdk|grep '/'|grep "openjdk-"|sed 's|/| |g'|awk '{print $1}'|grep 'jre'|sed -e 's|-jre.*||g'|uniq)";\
  case $JAVAVERSIONS in \
    *openjdk-17* ) apt install -y openjdk-17*;; \
    *openjdk-16* ) apt install -y openjdk-16*;; \
    *) echo "Unsupported Java Version, avaibles"; echo "$JAVAVERSIONS";exit 0;; \
  esac

# Create Volume to Storage Server And Config
VOLUME [ "/root/bds_core" ]

# Node packages
COPY package*.json ./
RUN npm install && npm run build

# Set default ENVs to Bds Core
ENV SERVER_VERSION="true" \
  PLAYERS="5" \
  WORLD_NAME="The Ultimate Server" \
  DESCRIPTION="running Minecraft Server on Bds Maneger by Bds Manager Project" \
  GAMEMODE="survival" \
  DIFFICULTY="normal" \
  ENABLE_COMMANDS="false" \
  ACCOUNT="false" \
  LEVEL_SEED="" \
  SERVER="bedrock" \
  SERVER_VERSION="latest" \
  NODE_ENV="production"
EXPOSE 19132/udp 19133/udp 1932/tcp
WORKDIR /opt/backend_core_scripts/
ENTRYPOINT [ "sh", "-c", "node bin/BdsManeger.js start -ak -d ${SERVER_VERSION} -p ${SERVER} --players ${PLAYERS} --world-name ${WORLD_NAME} --description ${DESCRIPTION} --gamemode ${GAMEMODE} --difficulty ${DIFFICULTY} --level-seed ${LEVEL_SEED}" ]
COPY ./ ./
