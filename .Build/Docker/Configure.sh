#!/usr/bin/env bash
set -ex
# Update Debian Repository
apt update

# Install Necessary Packages
apt install -y curl wget git zsh sudo unzip zip jq python python3 screen

# Install Build Dependencies
apt install -y ca-certificates make build-essential

# Install Libs
apt install -y procps lsb-release xdg-utils g++ libnss3 libatk-bridge2.0-0 gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxrandr2 libxrender1 libxss1 libxtst6 fonts-liberation libnss3 libgbm-dev

# Install Dependencies to diferent architectures
if ! [ "$(uname -m)" == "x86_64" ];then
    mkdir -p /lib64
    apt install -y qemu-user-static
    wget -q "https://github.com/The-Bds-Maneger/external_files/raw/main/linux_libries.zip" -O /tmp/libries.zip
    unzip -o /tmp/libries.zip -d /
    rm -rfv /tmp/libries.zip
fi

# Install openjdk
case "$(uname -m)" in
    x86_64 | aarch64 ) apt install -y openjdk-17*;;
    * ) apt install -y openjdk-11*;;
esac

# Install nodejs from github release
get_current_node_version=$(curl -sL https://api.github.com/repos/nodejs/node/releases/latest | grep tag_name | cut -d '"' -f 4)
case $(uname -m) in
    x86_64 ) wget -q https://nodejs.org/download/release/$get_current_node_version/node-$get_current_node_version-linux-x64.tar.xz -O /tmp/node.tar.xz;;
    aarch64 ) wget -q https://nodejs.org/download/release/$get_current_node_version/node-$get_current_node_version-linux-arm64.tar.xz -O /tmp/node.tar.xz;;
    armv7l ) wget -q https://nodejs.org/download/release/$get_current_node_version/node-$get_current_node_version-linux-armv7l.tar.xz -O /tmp/node.tar.xz;;
    ppc64el ) wget -q https://nodejs.org/download/release/$get_current_node_version/node-$get_current_node_version-linux-ppc64le.tar.xz -O /tmp/node.tar.xz;;
    s390x ) wget -q https://nodejs.org/download/release/$get_current_node_version/node-$get_current_node_version-linux-s390x.tar.xz -O /tmp/node.tar.xz;;
    *) echo "Unsupported architecture"; exit 1;;
esac
tar -xJf /tmp/node.tar.xz -C /usr
rm -rf /tmp/node.tar.xz

# Setup non root user
useradd -m -p "$(perl -e 'print crypt($ARGV[0], "password")' "LucaA1113ba21")" "thebds"
addgroup thebds sudo
addgroup thebds root
usermod --shell /bin/bash thebds;
echo "thebds   ALL=(ALL:ALL) NOPASSWD: ALL" >> /etc/sudoers

# Remove Unnecessary Packages
apt autoremove -y

# Clean up apt cache
apt clean -y

# Remove Unnecessary Files
rm -rf /var/lib/apt/lists/* /root/.gnupg /tmp/*

# Sucessfully installed
exit 0