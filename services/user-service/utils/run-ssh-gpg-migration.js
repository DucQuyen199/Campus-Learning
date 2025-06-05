const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigration() {
  try {
    console.log('Running SSH and GPG tables migration...');
    
    // Read the SQL migration file
    const migrationFilePath = path.join(__dirname, 'migrations', 'ssh_gpg_tables.sql');
    const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Execute the SQL
    await pool.request().query(migrationSql);
    
    console.log('SSH and GPG tables migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration if executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration script failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigration }; 