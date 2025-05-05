FROM node:18-slim

# Install Docker CLI for Docker-in-Docker capability
RUN apt-get update && \
    apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add - && \
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable" && \
    apt-get update && \
    apt-get install -y docker-ce-cli

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Create temp directory for code execution
RUN mkdir -p temp && chmod 777 temp

# Create uploads directory for file uploads
RUN mkdir -p uploads/images uploads/videos uploads/chat uploads/stories/images uploads/stories/videos && \
    chmod -R 777 uploads

# Expose port
EXPOSE 5001

# Start server
CMD ["node", "server.js"] 