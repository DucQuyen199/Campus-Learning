// Test script for schedule model
require('dotenv').config();
process.env.DEMO_MODE = 'true';

const ScheduleModel = require('./src/models/schedule');
const axios = require('axios');

async function testScheduleModel() {
  console.log('Testing Schedule Model in Mock Mode');
  
  try {
    console.log('\n--- Testing getClassSchedule ---');
    const classSchedule = await ScheduleModel.getClassSchedule(1);
    console.log(`Class Schedule Count: ${classSchedule.length}`);
    console.log('First class:', JSON.stringify(classSchedule[0], null, 2).substring(0, 300) + '...');
    
    console.log('\n--- Testing getExamSchedule ---');
    const examSchedule = await ScheduleModel.getExamSchedule(1);
    console.log(`Exam Schedule Count: ${examSchedule.length}`);
    console.log('First exam:', JSON.stringify(examSchedule[0], null, 2));
    
    console.log('\n--- Testing getDaySchedule ---');
    const today = new Date();
    const daySchedule = await ScheduleModel.getDaySchedule(1, today);
    console.log(`Day Schedule for ${today.toISOString().split('T')[0]}:`);
    console.log(`Classes: ${daySchedule.classes.length}`);
    console.log(`Exams: ${daySchedule.exams.length}`);
    console.log('Day schedule:', JSON.stringify(daySchedule, null, 2));
    
    console.log('\nAll tests completed successfully ✅');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Configuration
const API_BASE_URL = 'http://localhost:5008/api';
const USER_ID = 1;  // Test user ID

// Test functions
async function testGetAvailableCourses() {
  try {
    console.log('\n===== Testing Get Available Courses =====');
    const response = await axios.get(`${API_BASE_URL}/academic/available-courses`);
    
    console.log('Status:', response.status);
    console.log('Available Courses:', response.data.data.length);
    
    if (response.data.data.length > 0) {
      console.log('Sample Course:', response.data.data[0]);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error testing available courses:', error.response?.data || error.message);
    return null;
  }
}

async function testGetRegisteredCourses() {
  try {
    console.log('\n===== Testing Get Registered Courses =====');
    const response = await axios.get(`${API_BASE_URL}/academic/registrations/${USER_ID}`);
    
    console.log('Status:', response.status);
    console.log('Registered Courses:', response.data.data.length);
    
    if (response.data.data.length > 0) {
      console.log('Sample Registration:', response.data.data[0]);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error testing registered courses:', error.response?.data || error.message);
    return null;
  }
}

async function testRegisterCourse(classId) {
  try {
    console.log('\n===== Testing Register Course =====');
    const response = await axios.post(`${API_BASE_URL}/academic/register-course`, {
      userId: USER_ID,
      classId: classId,
      registrationType: 'Regular'
    });
    
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error testing register course:', error.response?.data || error.message);
    return null;
  }
}

async function testCancelRegistration(registrationId) {
  try {
    console.log('\n===== Testing Cancel Registration =====');
    const response = await axios.delete(`${API_BASE_URL}/academic/cancel-registration/${registrationId}`, {
      data: { userId: USER_ID }
    });
    
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error testing cancel registration:', error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  try {
    console.log('Starting API Tests...');
    
    // Step 1: Get available courses
    const availableCoursesData = await testGetAvailableCourses();
    if (!availableCoursesData || !availableCoursesData.data || availableCoursesData.data.length === 0) {
      console.error('No available courses found, cannot continue tests');
      return;
    }
    
    // Get the first available course
    const classToRegister = availableCoursesData.data[0].ClassID;
    console.log(`Selected course ID for registration: ${classToRegister}`);
    
    // Step 2: Register for a course
    const registrationResult = await testRegisterCourse(classToRegister);
    if (!registrationResult || !registrationResult.success) {
      console.error('Course registration failed, cannot continue tests');
      return;
    }
    
    // Get the registration ID
    const registrationId = registrationResult.data.RegistrationID;
    console.log(`Registration completed with ID: ${registrationId}`);
    
    // Step 3: Get registered courses to verify
    await testGetRegisteredCourses();
    
    // Step 4: Cancel the registration
    await testCancelRegistration(registrationId);
    
    // Step 5: Get registered courses again to verify cancellation
    await testGetRegisteredCourses();
    
    console.log('\nTests completed successfully!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();

// Run the test
testScheduleModel(); 