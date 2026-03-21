FROM node:20-alpine

RUN npm install -g pnpm@8.15.0

WORKDIR /app

COPY package.json ./
RUN pnpm install

COPY . .

EXPOSE 3010

CMD ["pnpm", "dev"]
