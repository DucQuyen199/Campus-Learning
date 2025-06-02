// API Base URLs
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Other constants
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Feature flags
export const FEATURES = {
  FEEDBACK_ENABLED: true,
  ONLINE_SERVICES_ENABLED: true,
}; 