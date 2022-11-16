FROM ghcr.io/sirherobrine23/initjs:latest
# Install dependecies to Bedrock server
RUN (apt update && apt install -y libssl1.1 || (echo "deb http://security.ubuntu.com/ubuntu focal-security main" | tee /etc/apt/sources.list.d/focal-security.list && apt update && apt install -y libssl1.1)) || echo exit $?

# Add non root user and Install oh my zsh
ARG USERNAME="devcontainer"
ARG USER_UID="1000"
ARG USER_GID=$USER_UID
RUN initjs create-user --username "${USERNAME}" --uid "${USER_UID}" --gid "${USER_GID}" --groups sudo --groups docker
USER $USERNAME
WORKDIR /home/$USERNAME
