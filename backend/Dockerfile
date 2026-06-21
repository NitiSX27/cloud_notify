FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Install pm2 globally
RUN npm install -g pm2

EXPOSE 8080

CMD ["pm2-runtime", "ecosystem.config.js"]