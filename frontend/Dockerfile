FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 5173
HEALTHCHECK --interval=10s --timeout=3s --retries=3 --start-period=20s \
  CMD node -e "const http=require('http');const req=http.get('http://localhost:5173');req.on('error',()=>process.exit(1));req.on('response',()=>process.exit(0))"
CMD ["nginx", "-g", "daemon off;"]
