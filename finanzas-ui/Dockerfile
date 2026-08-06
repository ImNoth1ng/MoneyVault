# Stage 1: Build React Vite app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml* package-lock.yaml* ./
RUN npm install -g pnpm && (pnpm install --frozen-lockfile || npm install)

# Copy source code
COPY . .

# Set relative API URL so frontend talks to Nginx proxy on same host/port
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build static assets
RUN npm run build || pnpm build

# Stage 2: Serve static files with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
