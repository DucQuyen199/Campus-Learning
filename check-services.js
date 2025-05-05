// Script to check if all required services are running
const axios = require('axios');
const { exec } = require('child_process');

// Configuration
const SERVICES = [
  {
    name: 'User Service API',
    url: 'http://localhost:5001/health',
    expectedResponse: { status: 'ok' }
  },
  {
    name: 'Exam Service API',
    url: 'http://localhost:3001/health',
    expectedResponse: { status: 'ok' }
  },
  {
    name: 'Frontend User App',
    url: 'http://localhost:5173',
    type: 'web'
  }
];

// Check for running processes
function checkProcesses() {
  return new Promise((resolve) => {
    exec('ps aux | grep node', (error, stdout) => {
      if (error) {
        console.error('Error checking processes:', error);
        return resolve([]);
      }
      
      const lines = stdout.split('\n');
      const nodeProcesses = lines.filter(line => 
        line.includes('node') && 
        !line.includes('grep') && 
        !line.includes('check-services.js')
      );
      
      console.log('\n=== RUNNING NODE PROCESSES ===');
      nodeProcesses.forEach(process => console.log(process));
      
      resolve(nodeProcesses);
    });
  });
}

// Check services
async function checkServices() {
  console.log('=== CHECKING SERVICES ===');
  
  for (const service of SERVICES) {
    try {
      console.log(`\nChecking ${service.name}...`);
      const response = await axios.get(service.url, { timeout: 3000 });
      
      if (service.type === 'web') {
        console.log(`✅ ${service.name} is running (status: ${response.status})`);
      } else if (
        service.expectedResponse && 
        JSON.stringify(response.data) === JSON.stringify(service.expectedResponse)
      ) {
        console.log(`✅ ${service.name} is running and healthy`);
      } else {
        console.log(`⚠️ ${service.name} responded but with unexpected data:`, response.data);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${service.name} is NOT running (connection refused)`);
      } else {
        console.log(`❌ ${service.name} check failed:`, error.message);
      }
    }
  }
}

// Check database connection indirectly through API
async function checkDatabase() {
  console.log('\n=== CHECKING DATABASE CONNECTION ===');
  
  try {
    const response = await axios.get('http://localhost:5001/api/health/database', { timeout: 3000 });
    
    if (response.data.status === 'connected') {
      console.log('✅ Database connection is working');
    } else {
      console.log('⚠️ Database may have issues:', response.data);
    }
  } catch (error) {
    console.log('❌ Could not verify database connection:', error.message);
    console.log('   This could be because the API service is not running or the endpoint is not implemented');
  }
}

// Check Redis if used
async function checkRedis() {
  console.log('\n=== CHECKING REDIS CONNECTION ===');
  
  try {
    const response = await axios.get('http://localhost:5001/api/health/redis', { timeout: 3000 });
    
    if (response.data.status === 'connected') {
      console.log('✅ Redis connection is working');
    } else {
      console.log('⚠️ Redis may have issues:', response.data);
    }
  } catch (error) {
    console.log('❌ Could not verify Redis connection:', error.message);
    console.log('   This could be because Redis is not used, the API service is not running, or the endpoint is not implemented');
  }
}

// Check environment variables
function checkEnvironment() {
  console.log('\n=== CHECKING ENVIRONMENT VARIABLES ===');
  
  const criticalEnvVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_SECRET'
  ];
  
  criticalEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} is set`);
    } else {
      console.log(`❌ ${envVar} is NOT set`);
    }
  });
}

// Main function
async function main() {
  console.log('====================================');
  console.log('       SERVICE HEALTH CHECK');
  console.log('====================================');
  
  await checkProcesses();
  await checkServices();
  await checkDatabase();
  await checkRedis();
  checkEnvironment();
  
  console.log('\n====================================');
  console.log('Health check completed');
  console.log('====================================');
}

// Run the script
main().catch(error => {
  console.error('Error running health check:', error);
});