FROM ghcr.io/the-bds-maneger/container:latest
WORKDIR /testApp
COPY ./package*.json ./
RUN npm ci
COPY ./ ./
RUN npm run test:host -- --exit-on-error --show-return