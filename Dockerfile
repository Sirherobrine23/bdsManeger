# bdsmaneger/node_image
FROM debian:latest AS bdsbase
USER root
RUN echo "Arch System: $(uname -m)"
ENV DEBIAN_FRONTEND=noninteractive DOCKER_IMAGE="true"
RUN apt-get update && \
apt-get -y install curl wget git zsh libnss3 libatk-bridge2.0-0 gconf-service libasound2 libatk1.0-0 libc6 \
libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils libgbm-dev git wget curl sudo && \
apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /root/.gnupg /tmp/library-scripts /tmp/*

RUN wget -qO- https://deb.nodesource.com/setup_current.x | bash - && \
apt install -y nodejs && \
npm install -g -f npm && \
npm install -g eslint && \
npm cache clean --force > /dev/null 2>&1 && \
apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /root/.gnupg /tmp/*

FROM bdsbase AS bdscore
RUN echo "Arch System: $(uname -m)"

RUN apt update && \
apt install -y git curl openjdk-11-jdk openjdk-11-jre wget jq sudo unzip zip screen nginx python make build-essential && \
rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/* /tmp/* /etc/nginx/sites-*/default && mkdir -p /home/bds/

RUN case $(uname -m) in \
    "x86_64") echo "Do not need dependency on the x86_64";;\
    *) \
    apt update && \
    apt install -y qemu-user-static && \
    wget https://raw.githubusercontent.com/The-Bds-Maneger/Raw_files/main/linux_libries.zip -O /tmp/libries.zip && \
    unzip /tmp/libries.zip -d / && \
    rm -rfv /tmp/libries.zip && \
    mkdir -p /lib64 && \
    ln -s /lib/x86_64-linux-gnu/ld-2.31.so /lib64/ld-linux-x86-64.so.2 && \
    rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/* /tmp/* ;; \
esac

ENV \
TELEGRAM_TOKEN="null" \
DESCRIPTION="running Minecraft Bedrock Server on the docker by Bds Manager" \
WORLD_NAME="Bds Maneger Docker" \
GAMEMODE="survival" \
DIFFICULTY="normal" \
XBOX_ACCOUNT="false" \
PLAYERS="13" \
BDS_VERSION="latest" \
SERVER="bedrock" \
BDS_REINSTALL="true" \
Docker_Debug_Script="false"

EXPOSE 80/tcp 19132/udp 19133/udp
ENV BDS_DOCKER_IMAGE="true" HOME="/home/bds/"

# Non Root User
RUN \
export username="thebds" && \
export password="123aa3456s7" && \
pass=$(perl -e 'print crypt($ARGV[0], "password")' $password); \
useradd -m -p "$pass" "$username"; \
addgroup ${username} sudo; \
usermod --shell /bin/bash --home /tmp/ ${username}; \
echo "${username}   ALL=(ALL:ALL) NOPASSWD: ALL" >> /etc/sudoers && \
mkdir -p /home/ /opt/bdsCore/ /base/

# Copy Files
COPY ./Docker/root_path/ /
COPY ./ /opt/bdsCore/
RUN chmod -R 7777 /home/ /opt/bdsCore/ /base/ && chown thebds:thebds -R /home/ /opt/bdsCore/ /base/
USER thebds
RUN cd /opt/bdsCore/ && npm install --no-save

RUN mkdir -p /home/bds/.config/@the-bds-maneger/core

# Entrypint
WORKDIR /home/bds/
RUN chmod +x /base/init.js
ENTRYPOINT ["/base/init.js"]
