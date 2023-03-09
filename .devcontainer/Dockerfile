FROM ghcr.io/sirherobrine23/initjs:latest
USER root
# Add non root user and Install oh my zsh
ARG USERNAME="devcontainer"
ARG USER_UID="1000"
ARG USER_GID=$USER_UID
RUN initjs create-user --username "${USERNAME}" --uid "${USER_UID}" --gid "${USER_GID}" --groups sudo --groups docker
USER $USERNAME
WORKDIR /home/$USERNAME