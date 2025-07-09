# ---------- Build Stage ----------
FROM node:18 AS build
WORKDIR /app

# Copy only package files first (cache optimization)
COPY package.json .
COPY package-lock.json .

# Install dependencies with proper permissions
RUN npm ci --unsafe-perm

# Copy the rest of the application
COPY . .
# Limit Node.js memory usage and concurrency for low-resource build
ENV NODE_OPTIONS=--max-old-space-size=1024
ENV VITE_BUILD_CONCURRENCY=1
RUN chmod +x node_modules/.bin/vite
RUN npm run build

# ---------- NGINX Serve Stage ----------
FROM nginx:1.25-alpine AS serve
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built files from the build stage
COPY --from=build /app/dist .
# Copy custom nginx config template
COPY nginx.conf.template /etc/nginx/conf.d/nginx.conf.template
# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
