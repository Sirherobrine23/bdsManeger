FROM ghcr.io/the-bds-maneger/base:main
USER root
RUN useradd -M -s /usr/bin/zsh -p $(perl -e 'print crypt($ARGV[0], "password")' vscode) vscode; echo "vscode    ALL=(ALL:ALL) NOPASSWD:   ALL" > /etc/sudoers.d/vscode

# User: vscode
USER vscode
WORKDIR /home/vscode
RUN yes | sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
RUN git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
RUN git clone https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
COPY .zshrc ./