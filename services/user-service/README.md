# Campust User Service with Docker-based Code Execution

This service provides authentication, user management, course management, and secure code execution capabilities for the Campust learning platform.

## Features

- **User Authentication**: JWT-based authentication system
- **Course Management**: Enroll, access, and complete courses
- **Secure Code Execution**: Run user code inside isolated Docker containers
- **Multiple Language Support**: Execute code in JavaScript, Python, C++, Java, and C#

## Requirements

- Docker and Docker Compose
- Node.js 18+ (for local development only)
- Docker socket must be accessible to run the code execution feature

## Setup

### Using Docker Compose (Recommended)

1. Make sure Docker and Docker Compose are installed.
2. Clone the repository.
3. Navigate to the user-service directory.
4. Create a `.env` file based on the `.env.example` template.
5. Run the service:

```bash
docker-compose up -d
```

### Manual Setup (Development)

1. Install Node.js 18 or later.
2. Install Docker on your machine.
3. Clone the repository.
4. Navigate to the user-service directory.
5. Create a `.env` file based on the `.env.example` template.
6. Install dependencies:

```bash
npm install
```

7. Run the service:

```bash
npm run dev
```

## Code Execution API

The service provides two main endpoints for code execution:

### Execute Code

Runs code in a Docker container without saving the results.

```http
POST /api/execute-code
```

Request body:
```json
{
  "code": "console.log('Hello World');",
  "language": "javascript",
  "stdin": "Optional stdin data"
}
```

### Submit Code for Evaluation

Runs code in a Docker container and evaluates it against test cases.

```http
POST /api/lessons/:lessonId/submit-code
```

Request body:
```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript",
  "exerciseId": "Optional exercise ID if submitting for a specific exercise"
}
```

## Supported Languages

- JavaScript (Node.js 18)
- Python 3.10
- C++ (gcc latest)
- Java (OpenJDK 17)
- C# (.NET SDK 6.0)

## Security Considerations

- All code is executed in isolated Docker containers with resource limits.
- Containers are automatically cleaned up after execution.
- Files created during execution are isolated and cleaned up.
- Network access is restricted inside the containers.

## Environment Variables

Create a `.env` file with the following variables:

```
# Server settings
PORT=5001
NODE_ENV=development

# Database settings
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# JWT settings
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h

# Docker settings (optional)
DOCKER_HOST=unix:///var/run/docker.sock
```

## Troubleshooting

### Docker Socket Issues

If you encounter permission issues with the Docker socket, make sure the user running the Node.js application has access to the Docker socket. You can add the user to the docker group:

```bash
sudo usermod -aG docker $USER
```

### Container Resource Issues

The code execution environment sets resource limits for each container. If you need to adjust these limits, modify the `LANGUAGE_CONFIGS` object in the `controllers/codeExecutionController.js` file.

## Docker-based Code Execution

This service includes a Docker-based code execution system that allows for safe and isolated execution of user code. It supports multiple programming languages:

- JavaScript (Node.js)
- Python
- C++ (GCC)
- Java (OpenJDK)
- C# (.NET)
- Rust (experimental)

### Setup Requirements

1. **Docker**: The system requires Docker to be installed and running on the host machine
2. **Docker Socket Access**: The service needs access to the Docker socket (`/var/run/docker.sock`)
3. **Required Images**: The service will automatically pull required Docker images, or you can pre-pull them:
   ```bash
   docker pull node:18-alpine
   docker pull python:3.10-slim
   docker pull gcc:latest
   docker pull openjdk:17-slim
   docker pull mcr.microsoft.com/dotnet/sdk:6.0
   ```

### Configuration

Environment variables for Docker code execution are set in the `.env` file:

```
ENABLE_DOCKER_CODE_EXECUTION=true   # Enable/disable Docker code execution
DOCKER_CODE_TEMP_DIR=/tmp/campust-code-execution   # Temp directory for code files
DOCKER_MAX_CONTAINERS=10   # Maximum number of simultaneous containers
DOCKER_CONTAINER_TIMEOUT=30000   # Container execution timeout in milliseconds
DOCKER_MEMORY_LIMIT_MB=200   # Memory limit per container
DOCKER_CPU_LIMIT=0.5   # CPU cores limit per container
```

### How It Works

1. User submits code through the frontend (CourseLearning.jsx or CompetitionDetail.jsx)
2. Code is sent to the backend API `/api/execute-code` endpoint
3. Backend creates a temporary directory and saves the code to a file
4. A Docker container is created with the appropriate language image
5. The code file is mounted into the container
6. The container executes the code with resource limits and timeout
7. Output and errors are captured and returned to the frontend
8. Temporary files are cleaned up

### Fallback Mechanisms

If Docker is not available, the system has fallbacks:

1. **JavaScript**: Run in Node.js VM sandbox on the server
2. **Python**: Try to execute with local Python interpreter if available
3. **Other languages**: Return a "Docker required" error message

### Troubleshooting

#### Docker Not Available

If Docker is not available, you'll see an error in the logs:

```
Docker initialization failed: Error: Cannot connect to the Docker daemon
Code execution functionality will be degraded or unavailable
```

**Solutions**:
- Ensure Docker is installed and running
- Check Docker socket permissions
- Try starting Docker: `systemctl start docker` or `service docker start`

#### Permission Issues

```
Error: connect EACCES /var/run/docker.sock
```

**Solutions**:
- Add the Node.js user to the docker group: `usermod -aG docker nodejs`
- Set explicit permissions: `chmod 666 /var/run/docker.sock`

#### Container Limits

If you see "Container creation rate limit exceeded" errors:

**Solutions**:
- Increase `DOCKER_MAX_CONTAINERS` in .env
- Add container cleanup cron job

### Testing Docker Execution

To test if Docker execution is working correctly:

1. Start the service
2. Visit `/api/code-execution/health` endpoint to check Docker status
3. Try the test endpoint: `/api/code-execution/test?language=python` 