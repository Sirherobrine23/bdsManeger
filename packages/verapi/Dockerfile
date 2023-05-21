FROM node:lts
WORKDIR /app
COPY ./ ./
RUN npm install --no-save
ENTRYPOINT [ "node", "src/index.js" ]