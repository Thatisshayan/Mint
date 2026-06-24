FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY backend/src ./src
COPY backend/tsconfig.json ./tsconfig.json
RUN npx tsc -p tsconfig.json
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY backend/prisma ./prisma
ENV NODE_ENV=production
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 --start-period=20s \
  CMD node -e "const http=require('http');const req=http.get('http://localhost:4000/health');req.on('error',()=>process.exit(1));req.on('response',()=>process.exit(0))"
CMD ["node", "dist/index.js"]
