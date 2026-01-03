#!/bin/bash
set -e

# SecureApps Deployment Script
# Run on Ubuntu server with Docker installed

echo "🚀 SecureApps Deployment Script"
echo "================================"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and back in, then run this script again."
    exit 1
fi

# Check for Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose v2."
    exit 1
fi

# Check for nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    sudo apt update && sudo apt install -y nginx
fi

# Create environment file if not exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from template..."
    cp deploy/.env.example .env
    echo "⚠️  Please edit .env with secure passwords before continuing!"
    echo "   Run: nano .env"
    exit 1
fi

# Start Supabase services
echo "🐳 Starting Supabase services..."
docker compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database..."
sleep 10

# Run migrations
echo "📊 Running database migrations..."
for migration in supabase/migrations/*.sql; do
    echo "  Running: $migration"
    docker exec -i supabase-db psql -U postgres -d postgres < "$migration"
done

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Deploy frontend
echo "📁 Deploying frontend..."
sudo mkdir -p /var/www/secureapps
sudo cp -r dist/* /var/www/secureapps/

# Setup nginx
echo "🌐 Configuring nginx..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/secureapps
sudo ln -sf /etc/nginx/sites-available/secureapps /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ Deployment complete!"
echo "================================"
echo "Frontend: http://$(hostname -I | awk '{print $1}')"
echo "Supabase Studio: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "Next steps:"
echo "1. Create an admin user in Supabase Studio"
echo "2. Configure SSL with certbot (recommended)"
