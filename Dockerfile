FROM node:12.6.0

RUN apt-get update && apt-get install -y build-essential && apt-get install -y python

WORKDIR /app

ENV NODE_ENV production

COPY package.json .
COPY package-lock.json .
RUN npm install --production

COPY . .

CMD ["npm", "run", "prod"]
