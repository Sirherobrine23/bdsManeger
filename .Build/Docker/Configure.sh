#!/usr/bin/env bash
set -ex
# Update Debian Repository
apt update

# Install Necessary Packages
apt -qq install -y curl wget git sudo unzip zip jq python3 xz-utils tar

# Install nodejs from github release
NODEVERSION=$(curl -sL https://api.github.com/repos/nodejs/node/releases | grep tag_name | cut -d '"' -f 4 | sort -V | tail -n 1)
case $(uname -m) in
    x86_64 ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-x64.tar.xz" -O /tmp/node.tar.xz;;
    aarch64 ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-arm64.tar.xz" -O /tmp/node.tar.xz;;
    armv7l ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-armv7l.tar.xz" -O /tmp/node.tar.xz;;
    ppc64el ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-ppc64le.tar.xz" -O /tmp/node.tar.xz;;
    s390x ) wget -q "https://nodejs.org/download/release/$NODEVERSION/node-$NODEVERSION-linux-s390x.tar.xz" -O /tmp/node.tar.xz;;
    *) echo "Unsupported architecture"; exit 1;;
esac

# Extract nodejs
mkdir /tmp/Node
tar -xJf /tmp/node.tar.xz -C /tmp/Node
rm -rf /tmp/node.tar.xz
cp -rf /tmp/Node/*/* /usr
rm -rf /tmp/Node

# Install Build Dependencies and others Packages
# apt install -y ca-certificates procps lsb-release libatomic1 libnss3 libatk-bridge2.0-0 gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxrandr2 libxrender1 libxss1 libxtst6 fonts-liberation libnss3 libgbm-dev
apt install -y libcurl4-openssl-dev curl

# Update npm
npm -g install npm@latest

# Install Dependencies to diferent architectures
if ! [ "$(uname -m)" == "x86_64" ];then
    mkdir -p /lib64
    apt install -y qemu-user-static
    wget -q "https://github.com/The-Bds-Maneger/external_files/raw/main/Linux/libs_amd64.zip" -O /tmp/libries.zip
    unzip -o /tmp/libries.zip -d /
    rm -rfv /tmp/libries.zip
fi

# Install openjdk
case "$(apt search openjdk)" in
    *openjdk-17* ) apt install -y openjdk-17*;;
    *openjdk-11* ) apt install -y openjdk-11*;;
    * ) echo "No openjdk version found, skipping";;
esac

# Remove Unnecessary Packages
apt autoremove -y

# Clean up apt cache
apt clean -y

# Remove Unnecessary Files
rm -rf /var/lib/apt/lists/* /root/.gnupg /tmp/*

# Sucessfully installed
exit 0
