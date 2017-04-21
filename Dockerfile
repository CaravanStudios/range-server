FROM node:slim

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

# Install pm2
RUN npm install -g pm2

ENV NODE_ENV docker

EXPOSE 8787
CMD ["pm2-docker", "index.js"]
