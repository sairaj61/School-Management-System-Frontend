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

# ---------- Serve Stage ----------
FROM node:18-slim AS serve
WORKDIR /app

# Install lightweight HTTP server
RUN npm install -g serve

# Copy built files from the build stage
COPY --from=build /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
