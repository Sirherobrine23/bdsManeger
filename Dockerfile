FROM bdsmaneger/node_image:latest
USER root
ENV DEBIAN_FRONTEND=noninteractive

RUN echo "Arch: $(uname -m)"

RUN \
apt update && \
apt install -y git curl openjdk-14-jdk openjdk-14-jre wget jq sudo unzip zip screen nginx python make build-essential && \
rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/* /tmp/* /etc/nginx/sites-*/default && mkdir -p /home/bds/

RUN case $(uname -m) in \
    "x86_64") echo "Do not need dependency on the x86_64";;\
    *) apt install -y qemu-user-static binfmt-support && \
    wget https://raw.githubusercontent.com/The-Bds-Maneger/Raw_files/main/linux_libries.zip -O /tmp/libries.zip && \
    unzip /tmp/libries.zip -d / && \
    rm -rfv /tmp/libries.zip && \
    mkdir -p /lib64 && \
    ln -s /lib/x86_64-linux-gnu/ld-2.31.so /lib64/ld-linux-x86-64.so.2 ;; \
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

# Copy Files
COPY ./Docker/root_path/ /
COPY ./ /opt/bdsCore/
RUN cd /opt/bdsCore/ && npm install --no-save

RUN mkdir -p /home/bds/.config/@the-bds-maneger/core

# Entrypint
WORKDIR /home/bds/
RUN chmod +x /base/init.sh
ENTRYPOINT ["/base/init.sh"]
