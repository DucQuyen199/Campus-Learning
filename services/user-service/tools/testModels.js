const { 
  sequelize, 
  Competition, 
  CompetitionRegistration, 
  User, 
  setupAssociations 
} = require('../models');

// Set up the associations before testing
setupAssociations();

async function testModels() {
  try {
    console.log('Testing database connection and models...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Test Competition model
    const competition = await Competition.findOne({
      limit: 1
    });
    console.log('Competition model test:', competition ? 'PASSED' : 'No competitions found, but model is working');
    
    // Test CompetitionRegistration model
    const registration = await CompetitionRegistration.findOne({
      limit: 1
    });
    console.log('CompetitionRegistration model test:', registration ? 'PASSED' : 'No registrations found, but model is working');
    
    // Test User model
    const user = await User.findOne({
      limit: 1
    });
    console.log('User model test:', user ? 'PASSED' : 'No users found, but model is working');
    
    // Test associations
    if (competition) {
      const registrations = await competition.getCompetitionRegistrations();
      console.log('Competition-Registration association test:', 'Found', registrations.length, 'registrations');
    }
    
    if (user) {
      const registrations = await user.getCompetitionRegistrations();
      console.log('User-Registration association test:', 'Found', registrations.length, 'registrations');
    }
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error testing models:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the tests
testModels(); 