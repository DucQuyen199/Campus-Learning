const { Sequelize } = require('sequelize');
require('dotenv').config();

// Custom type casting to handle date fields properly
// This prevents "Conversion failed when converting date and/or time from character string" errors
const customTypeCast = function (field, next) {
  // For SQL Server DATETIME fields, return the raw string value
  // This bypasses Sequelize's automatic date conversion
  if (field.type && (field.type.includes('DATETIME') || field.type.includes('DATE'))) {
    const value = field.string();
    if (value === null || value === undefined) {
      return null;
    }
    
    // Return the raw string as is, without any automatic conversion
    return value;
  }
  
  // For other field types, use the default behavior
  return next();
};

// Create Sequelize instance with configuration
const sequelize = new Sequelize(
    process.env.DB_NAME || 'Campushubt',
    process.env.DB_USER || 'sa',
    process.env.DB_PASSWORD || '123456aA@$',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 1433,
        dialect: 'mssql',
        dialectOptions: {
            options: {
                encrypt: false,
                useUTC: false,
                dateFirst: 1,
                timezone: '+07:00',
                enableArithAbort: true,
                trustServerCertificate: true,
                requestTimeout: 30000,
                dateFormat: 'ymd', // Set date format
                datefirst: 7, // Sunday is the first day
                // Force date strings to be treated as local times
                useNagleAlgorithm: true,
                connectTimeout: 30000
            },
            typeCast: customTypeCast, // Add custom type casting function
            // Prevent timezone issues with dates
            typeValidation: true,
            // Always use SQL Server's GETDATE() for timestamps 
            useDateString: true
        },
        define: {
            timestamps: false, // Disable automatic timestamps unless specified in model
            freezeTableName: true, // Use exact model name as table name
        },
        timezone: '+07:00', // Set timezone to Vietnam time (UTC+7)
        logging: true, // Enable logging temporarily to debug date issues
        query: {
            raw: false // Don't convert to raw objects
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('Database connected successfully');
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });

module.exports = sequelize; 