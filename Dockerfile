# ---------- Build Stage ----------
FROM node:18 AS build
WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci --unsafe-perm

COPY . .

ENV NODE_OPTIONS=--max-old-space-size=1024
ENV VITE_BUILD_CONCURRENCY=1
RUN chmod +x node_modules/.bin/vite
RUN npm run build

# ---------- NGINX Serve Stage ----------
FROM nginx:1.25-alpine AS serve
WORKDIR /usr/share/nginx/html

# Copy built frontend
COPY --from=build /app/dist /usr/share/nginx/html

# Copy NGINX template for envsubst
COPY nginx.template.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
