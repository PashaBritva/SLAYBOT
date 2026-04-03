#!/bin/bash
# deploy.sh — Quick deploy script for server deployment
# Usage: ./deploy.sh

set -e

echo "🚀 Deploying SLAYBOT..."

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Restart with pm2
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting with PM2..."
    pm2 reload slaybot 2>/dev/null || pm2 start bot.js --name slaybot
    pm2 save
    pm2 status
else
    echo "⚠️  PM2 not found. Please restart the bot manually."
    echo "    pm2 start bot.js --name slaybot"
fi

echo "✅ Deployment complete!"
