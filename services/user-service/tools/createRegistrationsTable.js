const { sequelize } = require('../models');

async function createRegistrationsTable() {
  try {
    console.log('Creating CompetitionRegistrations table...');
    
    // Run raw SQL to create the table
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CompetitionRegistrations' AND xtype='U')
      CREATE TABLE CompetitionRegistrations (
        RegistrationID INT PRIMARY KEY IDENTITY(1,1),
        UserID INT NOT NULL,
        CompetitionID INT NOT NULL,
        RegistrationDate DATETIME NOT NULL DEFAULT GETDATE(),
        Status NVARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
        Score INT DEFAULT 0,
        ProblemsSolved INT DEFAULT 0,
        Ranking INT,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_CompetitionRegistration_User FOREIGN KEY (UserID) REFERENCES Users(UserID),
        CONSTRAINT FK_CompetitionRegistration_Competition FOREIGN KEY (CompetitionID) REFERENCES Competitions(CompetitionID)
      );
    `);
    
    console.log('CompetitionRegistrations table created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
createRegistrationsTable(); 