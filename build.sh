#!/bin/bash
set -e

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

echo "================================================"
echo "Build complete."
echo "================================================"