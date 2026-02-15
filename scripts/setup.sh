#!/bin/bash

# AlphaX AI Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up AlphaX AI Development Environment..."

# Check Node.js version
node_version=$(node --version 2>/dev/null || echo "not installed")
if [[ $node_version == "not installed" ]]; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or later."
    exit 1
fi

echo "✅ Node.js version: $node_version"

# Check npm
npm_version=$(npm --version 2>/dev/null || echo "not installed")
if [[ $npm_version == "not installed" ]]; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $npm_version"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads/{datasets,images,documents}
mkdir -p data/backups

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting the server"
fi

# Check if Turso configuration exists
echo "🗄️  Checking Turso configuration..."
if grep -q "TURSO_DATABASE_URL=" .env; then
    echo "✅ TURSO_DATABASE_URL configured"
else
    echo "⚠️  TURSO_DATABASE_URL is missing from .env"
fi

# Check if Redis is available
echo "🔴 Checking Redis connection..."
if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running. Redis is optional but recommended for caching."
    fi
else
    echo "⚠️  Redis CLI not found. Redis is optional but recommended."
fi

# Run tests to ensure everything is working
echo "🧪 Running tests..."
npm test

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys and configuration"
echo "2. Start the development server: npm run dev"
echo "3. Visit http://localhost:3000 to see the application"
echo ""
echo "Available commands:"
echo "  npm run dev     - Start development server"
echo "  npm start       - Start production server"
echo "  npm test        - Run tests"
echo "  npm run lint    - Run linter"
echo "  npm run build   - Build the application"
echo ""