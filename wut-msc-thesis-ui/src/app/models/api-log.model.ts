/**
 * API Request Log Model - Represents a single API call log entry
 */
export interface ApiRequestLog {
  id?: number | string;
  timestamp?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  url: string;
  statusCode?: number;
  statusMessage?: string;
  success: boolean;
  errorMessage?: string;
  errorDetails?: any;
  stackTrace?: string;
  responseTime?: number; // in milliseconds
  frontend?: string; // Application name that made the request
  component?: string; // Component that made the request
  user?: string; // Username of the user
  userId?: string | number; // User ID
  userAgent?: string;
  ipAddress?: string;
  requestPayload?: any;
  responsePayload?: any;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * API Log Filter Criteria
 */
export interface ApiLogFilter {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  statusCode?: number;
  frontend?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  successOnly?: boolean;
  failedOnly?: boolean;
}

/**
 * API Log Statistics
 */
export interface ApiLogStatistics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  averageResponseTime: number;
  requestsByMethod: { [key: string]: number };
  requestsByStatus: { [key: number]: number };
  requestsByFrontend: { [key: string]: number };
}
