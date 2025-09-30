#!/bin/bash

# Build script for Render deployment
echo "🚀 Starting build process..."

# Check if we're building the server or client
if [ "$RENDER_SERVICE_TYPE" = "web" ] && [ "$RENDER_SERVICE_NAME" = "auction-server" ]; then
    echo "📦 Building server..."
    cd server
    npm ci --only=production
    echo "✅ Server build complete"
elif [ "$RENDER_SERVICE_TYPE" = "static" ] || [ "$RENDER_SERVICE_NAME" = "auction-client" ]; then
    echo "🎨 Building client..."
    cd client
    npm ci
    npm run build
    echo "✅ Client build complete"
else
    echo "🔧 Building both server and client..."
    
    # Build server
    echo "📦 Installing server dependencies..."
    cd server
    npm ci --only=production
    cd ..
    
    # Build client
    echo "🎨 Building client..."
    cd client
    npm ci
    npm run build
    cd ..
    
    echo "✅ Build complete"
fi
