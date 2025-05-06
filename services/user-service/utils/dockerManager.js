const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { spawn, exec } = require('child_process');
const execPromise = promisify(exec);

// Initialize Docker client
let docker;
let dockerAvailable = false;
try {
  // Try to connect to Docker socket
  if (process.env.DOCKER_HOST) {
    docker = new Docker({ host: process.env.DOCKER_HOST });
  } else {
    docker = new Docker();
  }
  dockerAvailable = true;
} catch (error) {
  console.error('Failed to initialize Docker client:', error);
  console.warn('Running in fallback mode without Docker - code execution will be limited');
  // Create a mock Docker client with empty methods
  docker = {
    info: async () => { throw new Error('Docker is not available'); },
    listImages: async () => [],
    createContainer: () => { throw new Error('Docker is not available'); }
  };
}

// Required Docker images for code execution
const REQUIRED_IMAGES = [
  'node:18-alpine',
  'python:3.10-slim',
  'gcc:latest',
  'openjdk:17-slim',
  'mcr.microsoft.com/dotnet/sdk:6.0'
];

/**
 * Check if Docker is available and running
 */
function checkDockerStatus() {
  return new Promise(async (resolve) => {
    try {
      const { stdout } = await execPromise('docker info');
      resolve({
        available: true,
        message: 'Docker is running',
        details: stdout.includes('Server Version') ? 'Docker daemon is running' : 'Docker connection issue'
      });
    } catch (error) {
      console.error('Docker connection error:', error.message);
      resolve({
        available: false,
        message: 'Docker is not available',
        error: error.message
      });
    }
  });
}

/**
 * Run code in a Docker container
 * @param {string} language Programming language
 * @param {string} filePath Path to the code file
 * @param {string} stdin Input to provide to the program
 * @returns {object} Docker container process with stdout, stderr, and stdin streams
 */
async function runDockerContainer(language, filePath, stdin = '') {
  // Get container configuration for the language
  const config = getContainerConfig(language);

  // Get the directory containing the file
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath);

  // Build Docker run command
  const dockerArgs = [
    'run',
    '--rm',
    '-i',
    '--name', `code-exec-${path.basename(filePath, path.extname(filePath))}`,
    '--network=none',                // No network access
    '--memory=512m',                 // Limit memory
    '--memory-swap=512m',            // Disable swap
    '--cpus=1',                      // Limit to 1 CPU
    '--ulimit', 'nproc=32:64',       // Limit processes/threads
    '--ulimit', 'nofile=64:128',     // Limit open files
    '-v', `${fileDir}:/code`,        // Mount code directory
    '-w', '/code',                   // Set working directory
    config.image,                    // Docker image
    ...config.commandArgs,           // Command arguments (varies by language)
    fileName                         // The file to execute
  ];

  // Spawn Docker container
  const container = spawn('docker', dockerArgs);

  // If stdin is provided, write it to the container's stdin
  if (stdin && container.stdin) {
    container.stdin.write(stdin);
    // Don't end stdin yet to allow for interactive input later
  }

  return container;
}

/**
 * Stop a running Docker container
 * @param {string} containerId Docker container ID
 */
async function stopContainer(containerId) {
  try {
    await execPromise(`docker stop ${containerId}`);
    console.log(`Container ${containerId} stopped successfully`);
    return true;
  } catch (error) {
    console.error(`Error stopping container ${containerId}:`, error.message);
    return false;
  }
}

/**
 * Get container configuration for the specified programming language
 * @param {string} language Programming language
 * @returns {object} Container configuration
 */
function getContainerConfig(language) {
  switch (language.toLowerCase()) {
    case 'javascript':
      return {
        image: 'node:18-alpine',
        commandArgs: ['node'],
        fileExtension: 'js'
      };
    case 'python':
      return {
        image: 'python:3.10-alpine',
        commandArgs: ['python'],
        fileExtension: 'py'
      };
    case 'java':
      return {
        image: 'openjdk:17-slim',
        commandArgs: ['java'],
        fileExtension: 'java'
      };
    case 'cpp':
      return {
        image: 'gcc:11.2.0',
        commandArgs: ['g++', '-o', 'output', '-std=c++17', '-O2'],
        fileExtension: 'cpp'
      };
    case 'csharp':
      return {
        image: 'mcr.microsoft.com/dotnet/sdk:7.0',
        commandArgs: ['dotnet', 'run'],
        fileExtension: 'cs'
      };
    default:
      return {
        image: 'alpine:latest',
        commandArgs: ['sh', '-c', 'cat'],
        fileExtension: 'txt'
      };
  }
}

/**
 * Pull Docker images required for code execution if they don't exist
 */
async function pullRequiredImages() {
  try {
    console.log('Checking for required Docker images...');

    // Get list of existing images
    const images = await docker.listImages();
    const existingImageTags = images.flatMap(img => img.RepoTags || []);

    // Filter required images that don't exist
    const missingImages = REQUIRED_IMAGES.filter(
      requiredImg => !existingImageTags.some(tag => tag === requiredImg || tag.startsWith(`${requiredImg}:`))
    );

    if (missingImages.length === 0) {
      console.log('All required Docker images are available');
      return { success: true, message: 'All required Docker images are available' };
    }

    console.log(`Need to pull ${missingImages.length} missing images: ${missingImages.join(', ')}`);

    // Pull missing images one by one
    const pullPromises = missingImages.map(async (imageName) => {
      console.log(`Pulling ${imageName}...`);

      try {
        await new Promise((resolve, reject) => {
          docker.pull(imageName, (err, stream) => {
            if (err) return reject(err);

            docker.modem.followProgress(stream, (err, output) => {
              if (err) return reject(err);
              resolve(output);
            });
          });
        });

        console.log(`Successfully pulled ${imageName}`);
        return { image: imageName, success: true };
      } catch (err) {
        console.error(`Failed to pull ${imageName}:`, err);
        return { image: imageName, success: false, error: err.message };
      }
    });

    // Wait for all pull operations to complete
    const results = await Promise.all(pullPromises);
    const allSucceeded = results.every(r => r.success);

    if (allSucceeded) {
      return {
        success: true,
        message: `Successfully pulled all missing images: ${missingImages.join(', ')}`
      };
    } else {
      const failedImages = results.filter(r => !r.success).map(r => r.image);
      return {
        success: false,
        message: `Failed to pull some images: ${failedImages.join(', ')}`,
        failedImages
      };
    }
  } catch (error) {
    console.error('Error checking/pulling Docker images:', error);
    return {
      success: false,
      message: `Error checking/pulling Docker images: ${error.message}`,
      error
    };
  }
}

/**
 * Initialize Docker on server startup or when requested
 */
async function initializeDocker() {
  try {
    console.log('Initializing Docker for code execution...');

    // Check if Docker is available
    const status = await checkDockerStatus();
    if (!status.available) {
      console.error('Docker is not available:', status.error);

      // Try to start Docker daemon if it's not running
      try {
        console.log('Attempting to start Docker daemon...');

        // Try different commands to start Docker based on platform
        if (process.platform === 'darwin') {
          // macOS
          await execPromise('open -a Docker');
          console.log('Sent command to open Docker Desktop on macOS');
        } else if (process.platform === 'linux') {
          // Linux
          await execPromise('sudo systemctl start docker');
          console.log('Sent command to start Docker service on Linux');
        } else if (process.platform === 'win32') {
          // Windows
          await execPromise('start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"');
          console.log('Sent command to start Docker Desktop on Windows');
        }

        // Wait for Docker to start
        console.log('Waiting for Docker to start...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Check again if Docker is available
        const retryStatus = await checkDockerStatus();
        if (retryStatus.available) {
          console.log('Docker started successfully!');
          dockerAvailable = true;
        } else {
          console.error('Docker still not available after start attempt:', retryStatus.error);
          dockerAvailable = false;
          return {
            success: false,
            message: 'Docker could not be started automatically',
            error: retryStatus.error
          };
        }
      } catch (startError) {
        console.error('Error starting Docker daemon:', startError);
        dockerAvailable = false;
        return {
          success: false,
          message: 'Error starting Docker daemon',
          error: startError.message
        };
      }
    } else {
      console.log('Docker is available:', status);
      dockerAvailable = true;
    }

    // Try to initialize Docker client if it's not already initialized
    if (!docker || !dockerAvailable) {
      try {
        if (process.env.DOCKER_HOST) {
          docker = new Docker({ host: process.env.DOCKER_HOST });
        } else {
          docker = new Docker();
        }
        dockerAvailable = true;
        console.log('Docker client initialized successfully');
      } catch (dockerError) {
        console.error('Error initializing Docker client:', dockerError);
        dockerAvailable = false;
        return {
          success: false,
          message: 'Error initializing Docker client',
          error: dockerError.message
        };
      }
    }

    // Pull required images
    const pullResult = await pullRequiredImages();

    // Start the execution service if it's not already running
    try {
      // Check if execution service is running
      const { stdout: psOutput } = await execPromise('ps aux | grep executionService.js | grep -v grep');
      if (!psOutput) {
        console.log('Execution service not running, starting it...');
        // Start execution service in background
        const execPath = path.join(__dirname, '..', 'executionService.js');
        exec(`node ${execPath} > /tmp/execution-service.log 2>&1 &`);
        console.log('Execution service started in background');
      } else {
        console.log('Execution service is already running');
      }
    } catch (execError) {
      // If grep returns no results, it will exit with code 1, which causes an error
      console.log('Execution service not running, starting it...');
      try {
        // Start execution service in background
        const execPath = path.join(__dirname, '..', 'executionService.js');
        exec(`node ${execPath} > /tmp/execution-service.log 2>&1 &`);
        console.log('Execution service started in background');
      } catch (startError) {
        console.error('Error starting execution service:', startError);
      }
    }

    return {
      success: true,
      message: `Docker initialized. ${pullResult.message}`,
      status: { available: dockerAvailable }
    };
  } catch (error) {
    console.error('Docker initialization failed:', error);
    return {
      success: false,
      message: `Docker initialization failed: ${error.message}`
    };
  }
}

/**
 * Check if the Docker runtime can execute a specific language
 */
function canExecuteLanguage(language) {
  if (!dockerAvailable) {
    return false;
  }

  // These languages can be executed if Docker is available
  const executableLanguages = ['javascript', 'python', 'java', 'cpp', 'csharp', 'rust'];
  return executableLanguages.includes(language.toLowerCase());
}

// Export Docker client and utility functions
module.exports = {
  docker,
  dockerAvailable,
  pullRequiredImages,
  initializeDocker,
  canExecuteLanguage,
  checkDockerStatus,
  REQUIRED_IMAGES,
  runDockerContainer,
  stopContainer,
  getContainerConfig
};