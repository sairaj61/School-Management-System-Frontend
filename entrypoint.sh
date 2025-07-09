#!/bin/sh
set -e

# Default BACKEND_URL if not set
: "${BACKEND_URL:=http://backend:8000}"

# Substitute BACKEND_URL in nginx.conf.template and write to nginx.conf
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'
