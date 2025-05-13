#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js to run this service.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm to run this service.${NC}"
    exit 1
fi

# Display welcome message
echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}   Student Service Starter      ${NC}"
echo -e "${BLUE}=================================${NC}"

# Check for .env file and create if not exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating default .env file...${NC}"
    cat > .env << EOF
PORT=5009
NODE_ENV=development
JWT_SECRET=your-secret-key-for-development
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=30d
CORS_ORIGIN=*
LOG_LEVEL=debug

# Database config (not needed in demo mode)
SQL_USER=sa
SQL_PASSWORD=YourStrongPassword123
SQL_SERVER=localhost
SQL_DATABASE=SinhVienDB

# Enable demo mode to use mock data instead of real database
DEMO_MODE=true
EOF
    echo -e "${GREEN}.env file created successfully${NC}"
fi

# Check for any missing dependencies
echo -e "${YELLOW}Checking for missing dependencies...${NC}"
npm install --no-fund --no-audit --silent

# Kill any existing process running on port 5009
echo -e "${YELLOW}Stopping any existing service on port 5009...${NC}"
lsof -i :5009 -t | xargs kill -9 2>/dev/null || true

# Set environment variables for demo mode
export DEMO_MODE=true
export PORT=5009

# Start the service
echo -e "${GREEN}Starting student service in DEMO MODE...${NC}"
echo -e "${YELLOW}Server will run on port 5009 with mock data${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the service${NC}"

# Run in dev mode with nodemon if available
if npm list -g nodemon &> /dev/null || npm list nodemon &> /dev/null; then
    echo -e "${GREEN}Using nodemon for auto-restart on changes${NC}"
    npx nodemon src/server.js
else
    echo -e "${YELLOW}Running without nodemon. Install nodemon globally for auto-restart on changes${NC}"
    node src/server.js
fi 