// Test script for code execution service
const { executeCode } = require('./utils/executionHelper');

async function testExecutionService() {
  console.log('Testing code execution service...');
  
  // Test JavaScript execution
  console.log('\nTesting JavaScript execution:');
  const jsResult = await executeCode('console.log("Hello from JavaScript!");', 'javascript');
  console.log('Result:', jsResult);
  
  // Test Python execution
  console.log('\nTesting Python execution:');
  const pyResult = await executeCode('print("Hello from Python!")', 'python');
  console.log('Result:', pyResult);
  
  // Test C++ execution
  console.log('\nTesting C++ execution:');
  const cppCode = `
#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}
  `;
  const cppResult = await executeCode(cppCode, 'cpp');
  console.log('Result:', cppResult);
}

// Run the test
testExecutionService().catch(error => {
  console.error('Test failed:', error);
}); 