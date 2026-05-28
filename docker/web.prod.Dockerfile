FROM node:20-alpine AS base
WORKDIR /app

# Khôi phục module
FROM base AS builder
COPY package*.json ./
COPY web/package*.json ./web/
COPY shared/package*.json ./shared/
RUN npm ci

# Build source code
COPY . .
WORKDIR /app/web
RUN npx prisma generate
RUN npm run build

# Chạy app siêu nhẹ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# Copy các file cần thiết từ builder
COPY --from=builder /app/web/public ./web/public
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./web/.next/static
COPY --from=builder /app/web/prisma ./web/prisma

EXPOSE 3000

# Server Next.js tự động khởi chạy
CMD ["node", "web/server.js"]
