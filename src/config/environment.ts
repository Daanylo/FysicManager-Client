// Environment configuration utility
// This ensures that environment variables are properly loaded and accessible

export const config = {
  apiBase: process.env.REACT_APP_API_BASE || 'http://localhost:5003/api/',
};

// Log the configuration on startup for debugging
console.log('Environment Configuration:', {
  apiBase: config.apiBase,
  nodeEnv: process.env.NODE_ENV,
});

export default config;
