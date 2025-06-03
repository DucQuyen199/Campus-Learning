// API base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5008/api';

// Other constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const DATE_FORMAT = 'DD/MM/YYYY';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// Registration types
export const REGISTRATION_TYPES = {
  REGULAR: 'Regular',
  RETAKE: 'Retake',
  IMPROVEMENT: 'Improvement'
};

// Academic statuses
export const ACADEMIC_STATUSES = {
  REGULAR: 'Regular',
  PROBATION: 'Probation',
  SUSPENDED: 'Suspended',
  EXPELLED: 'Expelled',
  GRADUATED: 'Graduated',
  ON_LEAVE: 'On Leave'
};

// Second major statuses
export const SECOND_MAJOR_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed'
};

// Feature flags
export const FEATURES = {
  FEEDBACK_ENABLED: true,
  ONLINE_SERVICES_ENABLED: true,
}; 