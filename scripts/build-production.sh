#!/bin/bash

# StarClip Production Build Script

echo "🔨 Building StarClip for production..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Build backend
echo "📦 Building backend..."
cd server
npm run build
cd ..

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. Copy 'dist/' folder to your server"
echo "2. Copy 'server/dist/' folder to your server"
echo "3. Copy 'server/prisma/' folder to your server"
echo "4. Copy 'server/package.json' to your server"
echo "5. Run 'npm install --production' in server folder on server"
echo "6. Run 'npx prisma generate' on server"
echo "7. Set up .env with production values"
echo "8. Start with: pm2 start ecosystem.config.js --env production"
