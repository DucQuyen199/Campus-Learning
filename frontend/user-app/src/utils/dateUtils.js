import { format as dateFormat } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format a date to a readable string using date-fns
 * @param {Date|string} date - The date to format
 * @param {string} formatStr - Optional format string (defaults to 'HH:mm - dd/MM/yyyy')
 * @param {boolean} useLocale - Whether to use Vietnamese locale (default: true)
 * @returns {string} The formatted date string
 */
export const formatDate = (date, formatStr = 'HH:mm - dd/MM/yyyy', useLocale = true) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateFormat(dateObj, formatStr, useLocale ? { locale: vi } : {});
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a duration in minutes to a readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes || isNaN(minutes)) return 'N/A';
  
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }
  
  return `${hours} giờ ${remainingMinutes} phút`;
};

/**
 * Get relative time (e.g. "2 days ago")
 * @param {Date|string} date - The date to get relative time for
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Vừa xong';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  }
  
  return dateFormat(dateObj, 'dd/MM/yyyy', { locale: vi });
}; 