# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache curl

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --skipLibCheck --resolveJsonModule --module commonjs --target es2016

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist/prisma/seed.js ./prisma/seed.js

RUN chown -R backend:nodejs /app/node_modules/@prisma \
    && chown -R backend:nodejs /app/node_modules/.prisma

# Create uploads directory with correct ownership BEFORE switching to non-root user
RUN mkdir -p /app/uploads/payslips \
    && chown -R backend:nodejs /app/uploads

USER backend

EXPOSE 4000

ENV PORT 4000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node prisma/seed.js && node dist/server.js"]
