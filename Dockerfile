FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build || echo "No build script found"

EXPOSE 3000

CMD ["npm", "start"]
