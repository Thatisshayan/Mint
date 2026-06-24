FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate --schema backend/prisma/schema.prisma
RUN npx tsc -p backend/tsconfig.json
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/frontend/dist ./frontend/dist
ENV NODE_ENV=production
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 --start-period=20s \
  CMD node -e "const http=require('http');const req=http.get('http://localhost:4000/health');req.on('error',()=>process.exit(1));req.on('response',()=>process.exit(0))"
CMD ["node", "dist/index.js"]
