#!/bin/bash

# Kill any processes running on ports 5010 and 5011
echo "Checking for processes using ports 5010 and 5011..."
lsof -ti:5010 | xargs kill -9 2>/dev/null
lsof -ti:5011 | xargs kill -9 2>/dev/null

# Set the working directory
cd "$(dirname "$0")"

# Start the backend service in the background
echo "Starting admin backend service on port 5011..."
cd services/admin-sinhvienservice
PORT=5011 NODE_ENV=development nodemon server.js &
BACKEND_PID=$!

# Wait a bit for the backend to start
sleep 2

# Start the frontend service
echo "Starting admin frontend on port 5010..."
cd ../../frontend/admin-sinhvienapp
PORT=5010 npm start &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
  echo "Shutting down services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Set up trap for script termination
trap cleanup SIGINT SIGTERM

# Keep the script running
echo "Services started. Press Ctrl+C to stop all services."
wait 