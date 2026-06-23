FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run backend:build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
