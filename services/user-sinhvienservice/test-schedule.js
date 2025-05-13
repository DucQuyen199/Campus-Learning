// Test script for schedule model
require('dotenv').config();
process.env.DEMO_MODE = 'true';

const ScheduleModel = require('./src/models/schedule');

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

// Run the test
testScheduleModel(); 