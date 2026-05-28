/**
 * Application Routes Configuration
 * Avoids hardcoding string paths across the codebase.
 */
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  VERIFICATION: '/verification',
  MEETING_POINTS: '/meeting-points',
  MY_POSTS: '/my-posts',
  
  ADMIN: {
    DASHBOARD: '/admin',
    LOGIN: '/admin/login',
    APPROVALS: '/admin/approvals',
    POSTS: '/admin/posts',
    DISPUTES: '/admin/disputes',
    LOGS: '/admin/logs',
    MEETING_POINTS: '/admin/meeting-points',
    REPUTATION: '/admin/reputations',
  }
} as const;

/**
 * API Endpoint Configuration
 * Avoids hardcoding endpoint paths across the codebase.
 */
export const API_ROUTES = {
  AUTH: {
    ME: '/api/auth/me',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    GOOGLE: '/api/auth/google',
  }
} as const;

export type AppRouteType = typeof APP_ROUTES;
export type ApiRouteType = typeof API_ROUTES;
