FROM node:20-alpine

WORKDIR /app

COPY apps/web/package*.json ./
RUN npm install

COPY apps/web .

ARG API_GATEWAY_URL
ENV API_GATEWAY_URL=${API_GATEWAY_URL:-http://gateway:8000}

RUN npm run build

CMD ["npm", "start"]
