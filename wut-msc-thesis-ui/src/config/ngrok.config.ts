/**
 * Centralized ngrok configuration
 * Update these URLs in ONE place when ngrok URLs change
 */
export const ngrokConfig = {
  // Set to false in production or when ngrok is not needed
  enabled: false,

  // Frontend ngrok URL (the URL you access from other PCs)
  frontend: 'https://ba55cb5969e2.ngrok-free.app',

  // Backend ngrok URL (if you want to route through ngrok backend)
  backend: 'https://e0bfde46d21b.ngrok-free.app',

  // Local backend URL (fallback/primary)
  localBackend: 'http://127.0.0.1:9001',
};

// Helper function to get the API URL based on context
export function getApiUrl(): string {
  // Use localhost backend directly (works best with local dev)
  return ngrokConfig.localBackend;
}

// Get all allowed CORS origins for backend configuration
export function getAllowedOrigins(): string[] {
  const origins = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
  ];

  if (ngrokConfig.enabled) {
    origins.push(ngrokConfig.frontend);
  }

  return origins;
}
