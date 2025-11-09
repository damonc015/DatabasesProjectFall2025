#!/bin/bash
set -e

# Install mise tools (Node.js, Python)
echo "Installing mise tools..."
mise install || true

# Activate mise environment
eval "$(mise activate bash)"

# Build frontend
echo "Building frontend..."
cd frontend

# Remove npm cache
rm -rf ~/.npm/_cacache || true
rm -rf ~/.npm/_cache || true

# Install dependencies
npm install --legacy-peer-deps --no-audit --no-fund

# Build
npm run build
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Make start.sh executable
chmod +x start.sh
chmod +x build.sh

echo "================================================"
echo "Build complete."
echo "================================================"