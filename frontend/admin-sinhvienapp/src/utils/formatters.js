/**
 * Format a number as Vietnamese currency (VND)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '--';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format a date string to Vietnamese format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '--';
  
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format a date string to Vietnamese format with time
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return '--';
  
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Truncate text with ellipsis if exceeds specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format a grade to display with 1 decimal place
 * @param {number} grade - The grade to format
 * @returns {string} Formatted grade
 */
export const formatGrade = (grade) => {
  if (grade === null || grade === undefined) return '--';
  
  return Number(grade).toFixed(1);
};

/**
 * Format percentage 
 * @param {number} value - The value to format as percentage
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '--';
  
  return `${Number(value).toFixed(1)}%`;
};

/**
 * Get letter grade from a numeric grade
 * @param {number} grade - The numeric grade
 * @returns {string} Letter grade
 */
export const getLetterGrade = (grade) => {
  if (grade === null || grade === undefined) return '--';
  
  if (grade >= 9.0) return 'A+';
  if (grade >= 8.5) return 'A';
  if (grade >= 8.0) return 'B+';
  if (grade >= 7.0) return 'B';
  if (grade >= 6.5) return 'C+';
  if (grade >= 5.5) return 'C';
  if (grade >= 5.0) return 'D+';
  if (grade >= 4.0) return 'D';
  return 'F';
}; 