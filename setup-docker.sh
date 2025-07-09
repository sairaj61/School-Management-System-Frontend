#!/bin/bash
set -e

echo "🔧 Updating system packages..."
sudo dnf update -y

echo "🐳 Installing Docker..."
sudo dnf install -y docker

echo "🚀 Starting and enabling Docker..."
sudo systemctl start docker
sudo systemctl enable docker

echo "👤 Adding ec2-user to the docker group..."
sudo usermod -aG docker ec2-user

echo "📁 Creating Docker CLI plugin directory..."
sudo mkdir -p /usr/local/lib/docker/cli-plugins

echo "📦 Installing Docker Compose v2..."
DOCKER_COMPOSE_VERSION="v2.27.0"
ARCH=$(uname -m)
sudo curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-${ARCH}" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose

sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo "🔗 Linking docker-compose binary (for legacy support)..."
sudo ln -s /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose || true

echo "✅ Checking Docker and Docker Compose installation..."
docker --version
docker compose version

echo ""
echo "✅ Docker and Docker Compose v2 installed and configured."
echo "👉 Logout and log back in, or run: newgrp docker"
