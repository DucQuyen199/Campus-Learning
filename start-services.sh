#!/bin/bash

# Title
echo "====================================="
echo "    Campus Hub Services Starter      "
echo "====================================="
echo ""

# Start backend service
echo "Starting backend user-sinhvienservice on port 5008..."
cd "$(dirname "$0")/services/user-sinhvienservice"
PORT=5008 npm run dev &
BACKEND_PID=$!
echo "Backend service started with PID: $BACKEND_PID"
echo ""

# Wait a moment for backend to initialize
sleep 2

# Start frontend service
echo "Starting frontend user-sinhvienapp on port 5009..."
cd "$(dirname "$0")/frontend/user-sinhvienapp"
PORT=5009 npm start &
FRONTEND_PID=$!
echo "Frontend service started with PID: $FRONTEND_PID"
echo ""

echo "All services started!"
echo "- Backend: http://localhost:5008"
echo "- Frontend: http://localhost:5009"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap SIGINT to kill both processes when the script is interrupted
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait for processes to finish
wait 