#!/bin/bash
set -e

# Install mise tools
echo "Installing mise tools..."
mise install

# Activate mise environment
eval "$(mise activate bash)"

if [ ! -d "frontend/dist" ]; then
    echo "Frontend not built, building now..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Start the backend server
echo "Starting backend..."
cd backend
python3 -m gunicorn wsgi:app --bind 0.0.0.0:${PORT:-5001}

