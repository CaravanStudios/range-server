FROM node:slim

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

COPY sshd_config /etc/ssh/
ENV NODE_ENV docker

EXPOSE 8787 80
CMD ["node", "index.js"]
