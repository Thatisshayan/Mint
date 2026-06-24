FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src
COPY backend/prisma ./prisma
RUN npx prisma generate --schema prisma/schema.prisma
RUN npx tsc -p tsconfig.json

COPY frontend ./frontend
COPY index.html ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
RUN npx vite build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/frontend/dist ./frontend/dist
ENV NODE_ENV=production
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 --start-period=20s \
  CMD node -e "const http=require('http');const req=http.get('http://localhost:4000/health');req.on('error',()=>process.exit(1));req.on('response',()=>process.exit(0))"
CMD ["node", "dist/index.js"]