#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting SinhVien API Service${NC}"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 14+ to continue.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm to continue.${NC}"
    exit 1
fi

# Check node version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)

if [ $MAJOR_VERSION -lt 14 ]; then
    echo -e "${YELLOW}Warning: Node.js version $NODE_VERSION detected. Recommended version is 14+.${NC}"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from sample...${NC}"
    echo -e "PORT=5008\nNODE_ENV=development\nDB_USER=sa\nDB_PASSWORD=123456aA@$\nDB_SERVER=localhost\nDB_NAME=campushubt\nJWT_SECRET=your-secret-key\nJWT_EXPIRES_IN=1d\nREFRESH_TOKEN_EXPIRES_IN=30d\nCORS_ORIGIN=*\nDEMO_MODE=false\nLOG_LEVEL=info" > .env
fi

# Check if node_modules directory exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if src directory exists
if [ ! -d "src" ]; then
    echo -e "${RED}Error: src directory not found. The application has not been properly restructured.${NC}"
    exit 1
fi

# Start the application based on NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${GREEN}Starting in PRODUCTION mode...${NC}"
    npm start
else
    echo -e "${GREEN}Starting in DEVELOPMENT mode...${NC}"
    npm run dev
fi 