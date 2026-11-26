FROM node:22-alpine

WORKDIR /account

COPY . .
COPY .env.example .env

RUN npm cache clean --force
RUN npm install -g @nestjs/cli argon2 ts-node rimraf

RUN npm install
RUN yarn build

CMD ["yarn", "start:prod" ]