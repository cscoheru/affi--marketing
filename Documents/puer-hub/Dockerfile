FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache ffmpeg

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs && adduser nextjs nodejs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma

# Create writable uploads directories
RUN mkdir -p /app/public/uploads/forum /app/public/uploads/videos /app/public/uploads/sessions /app/public/uploads/.tmp

# Install su-exec for privilege drop
RUN apk add --no-cache su-exec

# Entrypoint: fix volume permissions as root, then drop to nextjs
RUN printf '#!/bin/sh\nchown -R nextjs:nodejs /app/public/uploads/\nexec su-exec nextjs "$@"\n' > /sbin/entrypoint.sh && chmod +x /sbin/entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/sbin/entrypoint.sh"]
CMD ["node", "server.js"]
