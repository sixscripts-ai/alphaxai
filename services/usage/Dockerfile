FROM node:20-alpine

WORKDIR /app

# Copy shared packages first
COPY packages/database ./packages/database
COPY packages/logger ./packages/logger
COPY packages/shared-types ./packages/shared-types

# Build shared packages
WORKDIR /app/packages/database
RUN npm install && npm run build
WORKDIR /app/packages/logger
RUN npm install && npm run build

# Setup service
WORKDIR /app/services/usage
COPY services/usage/package*.json ./
RUN npm install

COPY services/usage .

RUN npm run build

CMD ["npm", "start"]
