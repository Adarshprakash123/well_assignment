# Use Debian-based image - Prisma has OpenSSL issues on Alpine
FROM node:20-slim

# Install OpenSSL for Prisma (required for schema engine)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/server.ts"]
