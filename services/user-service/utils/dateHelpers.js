/**
 * Date formatting utility functions for SQL Server compatibility
 */

/**
 * Formats a Date object to be compatible with SQL Server's datetime format
 * For dates being stored in the database
 * 
 * @param {Date} date - The date to format
 * @param {boolean} applyTimezone - Whether to apply Vietnam timezone conversion (default: true)
 * @returns {string} - The formatted date string for SQL Server
 */
function formatDateForSqlServer(date, applyTimezone = true) {
  if (!date) {
    date = new Date();
  }
  
  // Ensure we have a Date object
  if (!(date instanceof Date)) {
    try {
      date = new Date(date);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date provided:', date);
        // Return current date as fallback
        date = new Date();
      }
    } catch (error) {
      console.error('Error converting to Date object:', error);
      // Return current date as fallback
      date = new Date();
    }
  }
  
  let dateToFormat = date;
  
  // Convert to Vietnam timezone (UTC+7) if requested
  if (applyTimezone) {
    // Get the current UTC time in milliseconds
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    // Convert to Vietnam time (UTC+7)
    dateToFormat = new Date(utcTime + (7 * 3600000));
  }
  
  // Format as YYYY-MM-DD HH:MM:SS without timezone information
  const year = dateToFormat.getFullYear();
  const month = String(dateToFormat.getMonth() + 1).padStart(2, '0');
  const day = String(dateToFormat.getDate()).padStart(2, '0');
  const hours = String(dateToFormat.getHours()).padStart(2, '0');
  const minutes = String(dateToFormat.getMinutes()).padStart(2, '0');
  const seconds = String(dateToFormat.getSeconds()).padStart(2, '0');
  
  // SQL Server standard date format: YYYY-MM-DD HH:MM:SS
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Creates a SQL Server compatible date string in Vietnam timezone
 * For our current model configuration, we use the formatted date string
 * which is compatible with our model schema
 * 
 * @param {Date} date - Date object to format (defaults to current time)
 * @returns {string} SQL Server compatible date string in Vietnam timezone (UTC+7)
 */
const createSqlServerDate = (date = new Date()) => {
  // Return SQL Server compatible date string in Vietnam timezone
  return formatDateForSqlServer(date);
};

/**
 * Formats a SQL Server date string for display in Vietnam timezone
 * 
 * @param {string} sqlDate - SQL Server date string
 * @returns {string} Formatted date string for display
 */
const formatDateForDisplay = (sqlDate) => {
  if (!sqlDate) return '';
  
  try {
    const date = new Date(sqlDate);
    
    // Check if valid date
    if (isNaN(date.getTime())) {
      console.error('Invalid SQL date for display:', sqlDate);
      return '';
    }
    
    return date.toLocaleString('vi-VN', { 
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return '';
  }
};

/**
 * Formats a date from the database for display without timezone conversion
 * Used for sending dates to the frontend that should be displayed as-is
 * 
 * @param {Date|string} date - The date from the database
 * @returns {string} - The formatted date string
 */
function formatDateFromDatabase(date) {
  if (!date) {
    return '';
  }
  
  try {
    // Ensure we have a Date object
    if (!(date instanceof Date)) {
      date = new Date(date);
      
      // Check if valid date
      if (isNaN(date.getTime())) {
        console.error('Invalid database date:', date);
        return '';
      }
    }
    
    // Format as YYYY-MM-DD HH:MM:SS without timezone conversion
    return formatDateForSqlServer(date, false);
  } catch (error) {
    console.error('Error formatting date from database:', error);
    return '';
  }
}

module.exports = {
  formatDateForSqlServer,
  createSqlServerDate,
  formatDateForDisplay,
  formatDateFromDatabase
}; 