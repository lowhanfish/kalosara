FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM build AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

FROM build AS prune
RUN npm prune --omit=dev --legacy-peer-deps

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=prune /app/package.json ./package.json
COPY --from=prune /app/node_modules ./node_modules
COPY --from=prune /app/dist ./dist
COPY --from=prune /app/prisma ./prisma
USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]
