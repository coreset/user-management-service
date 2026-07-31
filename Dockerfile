# ---------- 1. Build Stage ----------
FROM node:22.14.0-slim AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ---------- 2. Runtime Stage ----------
FROM node:22.14.0-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
RUN yarn install --frozen-lockfile --production --ignore-scripts --prefer-offline

COPY --from=builder /app/dist ./dist

# Run as the built-in non-root `node` user (uid 1000) instead of root
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]
