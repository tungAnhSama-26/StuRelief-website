FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first for better caching
# Context is assumed to be project root (..)
COPY package*.json ./
COPY web/package*.json ./web/
COPY shared/package*.json ./shared/

RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
WORKDIR /app/web
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
